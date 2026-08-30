/**
 * JAX YouTube AdBlock - privacy-first local response filter
 *
 * Purpose:
 * - Remove classic YouTube player ad placements / ad slots from protobuf responses.
 * - Remove ad-marked Shorts entries.
 * - Remove page-ad conversion tracking embedded in player responses.
 *
 * Privacy properties:
 * - No fetch / $httpClient / $task.fetch / XMLHttpRequest.
 * - No persistent storage.
 * - No cookies, headers, URLs, account data, or playback keys are uploaded anywhere.
 * - Only transforms the response already intercepted locally by Shadowrocket.
 *
 * Scope:
 * - /youtubei/v1/player
 * - /youtubei/v1/get_watch
 * - /youtubei/v1/reel/reel_watch_sequence
 *
 * Notes:
 * - YouTube changes its protobuf schema and ad delivery methods over time.
 * - This intentionally avoids external UMP/initplayback workers. New server-side/encrypted
 *   ad delivery may therefore require future local-only updates.
 */

(() => {
  "use strict";

  function toUint8Array(body) {
    if (body == null) return null;
    if (body instanceof Uint8Array) return body;
    if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) {
      return new Uint8Array(body);
    }
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView?.(body)) {
      return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
    }
    if (typeof body === "string") {
      const out = new Uint8Array(body.length);
      for (let i = 0; i < body.length; i++) out[i] = body.charCodeAt(i) & 0xff;
      return out;
    }
    return null;
  }

  function readVarint(buf, start) {
    let value = 0;
    let factor = 1;
    let pos = start;
    for (let i = 0; i < 10 && pos < buf.length; i++, pos++) {
      const b = buf[pos];
      value += (b & 0x7f) * factor;
      if ((b & 0x80) === 0) return { value, next: pos + 1 };
      factor *= 128;
      if (!Number.isSafeInteger(value) || !Number.isSafeInteger(factor)) {
        throw new Error("protobuf varint exceeds safe integer range");
      }
    }
    throw new Error("invalid protobuf varint");
  }

  function writeVarint(value) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("invalid varint value");
    const out = [];
    do {
      let b = value % 128;
      value = Math.floor(value / 128);
      if (value > 0) b |= 0x80;
      out.push(b);
    } while (value > 0);
    return Uint8Array.from(out);
  }

  function parseFields(buf) {
    const fields = [];
    let pos = 0;
    while (pos < buf.length) {
      const keyStart = pos;
      const key = readVarint(buf, pos);
      const tag = key.value;
      pos = key.next;
      const tagEnd = pos;
      const no = Math.floor(tag / 8);
      const wire = tag & 7;
      if (no <= 0) throw new Error("invalid protobuf field number");

      const field = { no, wire, keyStart, tagEnd, end: pos, dataStart: null, dataEnd: null };

      if (wire === 0) {
        const v = readVarint(buf, pos);
        field.valueStart = pos;
        field.end = v.next;
        pos = v.next;
      } else if (wire === 1) {
        field.valueStart = pos;
        field.end = pos + 8;
        pos = field.end;
      } else if (wire === 2) {
        field.valueStart = pos;
        const len = readVarint(buf, pos);
        const length = len.value;
        field.dataStart = len.next;
        field.dataEnd = field.dataStart + length;
        field.end = field.dataEnd;
        if (field.end > buf.length) throw new Error("protobuf length exceeds message size");
        pos = field.end;
      } else if (wire === 5) {
        field.valueStart = pos;
        field.end = pos + 4;
        pos = field.end;
      } else {
        throw new Error(`unsupported protobuf wire type ${wire}`);
      }

      if (field.end > buf.length) throw new Error("truncated protobuf field");
      fields.push(field);
    }
    return fields;
  }

  function concat(chunks) {
    let total = 0;
    for (const c of chunks) total += c.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }

  function lengthDelimitedReplacement(buf, field, payload) {
    if (field.wire !== 2) throw new Error("field is not length-delimited");
    return concat([
      buf.subarray(field.keyStart, field.tagEnd),
      writeVarint(payload.length),
      payload,
    ]);
  }

  function transformMessage(buf, transform) {
    const fields = parseFields(buf);
    const chunks = [];
    let changed = false;

    for (const field of fields) {
      const replacement = transform(field, buf);
      if (replacement === null) {
        changed = true;
        continue;
      }
      if (replacement instanceof Uint8Array) {
        chunks.push(replacement);
        changed = true;
        continue;
      }
      chunks.push(buf.subarray(field.keyStart, field.end));
    }

    return changed ? { bytes: concat(chunks), changed: true } : { bytes: buf, changed: false };
  }

  function filterPlaybackTracking(buf) {
    return transformMessage(buf, (field) => {
      if (field.no === 18) return null;
      return undefined;
    });
  }

  function filterPlayer(buf) {
    return transformMessage(buf, (field, source) => {
      if (field.no === 7 || field.no === 68) return null;

      if (field.no === 9 && field.wire === 2) {
        const nested = source.subarray(field.dataStart, field.dataEnd);
        const result = filterPlaybackTracking(nested);
        if (result.changed) return lengthDelimitedReplacement(source, field, result.bytes);
      }
      return undefined;
    });
  }

  function filterWatchContent(buf) {
    return transformMessage(buf, (field, source) => {
      if (field.no === 2 && field.wire === 2) {
        const nested = source.subarray(field.dataStart, field.dataEnd);
        const result = filterPlayer(nested);
        if (result.changed) return lengthDelimitedReplacement(source, field, result.bytes);
      }
      return undefined;
    });
  }

  function filterGetWatch(buf) {
    return transformMessage(buf, (field, source) => {
      if (field.no === 1 && field.wire === 2) {
        const nested = source.subarray(field.dataStart, field.dataEnd);
        const result = filterWatchContent(nested);
        if (result.changed) return lengthDelimitedReplacement(source, field, result.bytes);
      }
      return undefined;
    });
  }

  function fieldPayload(buf, fieldNo) {
    for (const field of parseFields(buf)) {
      if (field.no === fieldNo && field.wire === 2) {
        return buf.subarray(field.dataStart, field.dataEnd);
      }
    }
    return null;
  }

  function fieldVarint(buf, fieldNo) {
    for (const field of parseFields(buf)) {
      if (field.no === fieldNo && field.wire === 0) {
        return readVarint(buf, field.valueStart).value;
      }
    }
    return null;
  }

  function isShortsAd(entry) {
    try {
      const command = fieldPayload(entry, 1);
      if (!command) return false;
      const endpoint = fieldPayload(command, 139608561);
      if (!endpoint) return false;
      const adParams = fieldPayload(endpoint, 16);
      if (!adParams) return false;
      return fieldVarint(adParams, 1) === 1;
    } catch (_) {
      return false;
    }
  }

  function filterShorts(buf) {
    return transformMessage(buf, (field, source) => {
      if (field.no === 2 && field.wire === 2) {
        const entry = source.subarray(field.dataStart, field.dataEnd);
        if (isShortsAd(entry)) return null;
      }
      return undefined;
    });
  }

  function finish(bytes, changed) {
    if (!changed) return $done({});
    return $done({ body: bytes });
  }

  try {
    const url = $request?.url || "";
    const input = toUint8Array($response?.body);
    if (!input || input.length === 0) return $done({});

    let result = { bytes: input, changed: false };
    if (/\/youtubei\/v1\/player(?:[/?#]|$)/.test(url)) {
      result = filterPlayer(input);
    } else if (/\/youtubei\/v1\/get_watch(?:[/?#]|$)/.test(url)) {
      result = filterGetWatch(input);
    } else if (/\/youtubei\/v1\/reel\/reel_watch_sequence(?:[/?#]|$)/.test(url)) {
      result = filterShorts(input);
    }

    return finish(result.bytes, result.changed);
  } catch (error) {
    console.log(`[JAX YouTube AdBlock] pass-through: ${String(error)}`);
    return $done({});
  }
})();
