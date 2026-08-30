// Local synthetic protobuf regression tests for scripts/youtube-adblock-local.js
// Run with: node tests/youtube-adblock-local.test.js

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "scripts", "youtube-adblock-local.js");
const code = fs.readFileSync(scriptPath, "utf8");

function varint(n) {
  const out = [];
  do {
    let b = n % 128;
    n = Math.floor(n / 128);
    if (n) b |= 0x80;
    out.push(b);
  } while (n);
  return Buffer.from(out);
}

function field(no, wire, payload) {
  const key = varint(no * 8 + wire);
  if (wire === 0) return Buffer.concat([key, varint(payload)]);
  if (wire === 2) {
    const data = Buffer.from(payload);
    return Buffer.concat([key, varint(data.length), data]);
  }
  throw new Error("unsupported test wire type");
}

function parse(buf) {
  let p = 0;
  const fields = [];
  function readVarint() {
    let value = 0;
    let factor = 1;
    while (true) {
      const b = buf[p++];
      value += (b & 0x7f) * factor;
      if (!(b & 0x80)) return value;
      factor *= 128;
    }
  }
  while (p < buf.length) {
    const tag = readVarint();
    const no = Math.floor(tag / 8);
    const wire = tag & 7;
    if (wire === 0) fields.push([no, wire, readVarint()]);
    else if (wire === 2) {
      const len = readVarint();
      const data = buf.subarray(p, p + len);
      p += len;
      fields.push([no, wire, data]);
    } else throw new Error("unexpected test wire type");
  }
  return fields;
}

function run(url, body) {
  let done;
  const context = {
    $request: { url },
    $response: { body: new Uint8Array(body) },
    $done: (value) => { done = value; },
    console,
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return Buffer.from(done?.body || body);
}

// 1) /player: remove adPlacements(7), adSlots(68), tracking field 18.
const tracking = Buffer.concat([
  field(18, 2, Buffer.from("adtrack")),
  field(3, 2, Buffer.from("keep")),
]);
const player = Buffer.concat([
  field(2, 0, 1),
  field(7, 2, Buffer.from([1])),
  field(9, 2, tracking),
  field(68, 2, Buffer.from([2])),
]);
const playerOut = run("https://youtubei.googleapis.com/youtubei/v1/player", player);
const playerFields = parse(playerOut);
if (playerFields.map((x) => x[0]).join(",") !== "2,9") throw new Error("player ad fields not removed");
const trackingFields = parse(playerFields.find((x) => x[0] === 9)[2]);
if (trackingFields.map((x) => x[0]).join(",") !== "3") throw new Error("tracking ad field not removed");

// 2) /get_watch: recursively filter embedded player.
const content = field(2, 2, player);
const watch = field(1, 2, content);
const watchOut = run("https://youtubei.googleapis.com/youtubei/v1/get_watch", watch);
const embeddedPlayer = parse(parse(watchOut)[0][2])[0][2];
if (parse(embeddedPlayer).some((x) => x[0] === 7 || x[0] === 68)) throw new Error("watch embedded ads not removed");

// 3) Shorts: drop Entry whose adClientParams.isAd = true, keep normal Entry.
const endpointAd = field(16, 2, field(1, 0, 1));
const commandAd = field(139608561, 2, endpointAd);
const entryAd = field(1, 2, commandAd);
const endpointOk = field(16, 2, field(1, 0, 0));
const commandOk = field(139608561, 2, endpointOk);
const entryOk = field(1, 2, commandOk);
const shorts = Buffer.concat([field(2, 2, entryAd), field(2, 2, entryOk)]);
const shortsOut = run("https://youtubei.googleapis.com/youtubei/v1/reel/reel_watch_sequence", shorts);
if (parse(shortsOut).length !== 1) throw new Error("Shorts ad entry not removed");

console.log("PASS: player, get_watch, shorts synthetic protobuf tests");
