/*
 * JAX TikTok Clean - local-only response filter
 *
 * Privacy design:
 * - No fetch / $httpClient / $task.fetch / XMLHttpRequest.
 * - No persistent storage.
 * - Does not read or upload Cookie, Authorization, account data, device keys, URLs or headers.
 * - Only filters ad items already present in a TikTok JSON response intercepted locally by Shadowrocket.
 * - Fail-open: parse errors return the original response unchanged.
 *
 * This script is intentionally NOT enabled by modules/tiktok-clean.module yet.
 * It will be enabled only after real TikTok connection logs confirm the smallest safe API hostname set.
 */

function isAdAweme(item) {
  if (!item || typeof item !== "object") return false;
  return item.is_ads === true || item.is_ads === 1 || item.is_ad === true || item.is_ad === 1;
}

function filterArray(value) {
  if (!Array.isArray(value)) return { value, changed: false };
  const filtered = value.filter((item) => !isAdAweme(item));
  return { value: filtered, changed: filtered.length !== value.length };
}

function filterTikTokAds(body) {
  const obj = JSON.parse(body);
  let changed = false;

  for (const key of ["aweme_list", "aweme_details"]) {
    const result = filterArray(obj[key]);
    if (result.changed) {
      obj[key] = result.value;
      changed = true;
    }
  }

  return {
    changed,
    body: changed ? JSON.stringify(obj) : body,
  };
}

if (typeof $response !== "undefined" && typeof $done === "function") {
  const originalBody = ($response && $response.body) || "";
  try {
    const result = filterTikTokAds(originalBody);
    $done({ body: result.body });
  } catch (_) {
    $done({ body: originalBody });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { isAdAweme, filterTikTokAds };
}
