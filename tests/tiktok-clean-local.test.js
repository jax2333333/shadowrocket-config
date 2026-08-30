const assert = require("assert");
const { isAdAweme, filterTikTokAds } = require("../scripts/tiktok-clean-local.js");

assert.strictEqual(isAdAweme({ is_ads: true }), true);
assert.strictEqual(isAdAweme({ is_ads: 1 }), true);
assert.strictEqual(isAdAweme({ is_ad: true }), true);
assert.strictEqual(isAdAweme({ is_ad: 1 }), true);
assert.strictEqual(isAdAweme({ is_ads: false }), false);
assert.strictEqual(isAdAweme({ aweme_id: "normal" }), false);

const feed = JSON.stringify({
  aweme_list: [
    { aweme_id: "normal-1", is_ads: false },
    { aweme_id: "ad-1", is_ads: true },
    { aweme_id: "normal-2" },
    { aweme_id: "ad-2", is_ad: 1 },
  ],
  status_code: 0,
});

const result = filterTikTokAds(feed);
assert.strictEqual(result.changed, true);
const parsed = JSON.parse(result.body);
assert.deepStrictEqual(parsed.aweme_list.map((x) => x.aweme_id), ["normal-1", "normal-2"]);
assert.strictEqual(parsed.status_code, 0);

const detailList = JSON.stringify({
  aweme_details: [
    { aweme_id: "normal" },
    { aweme_id: "ad", is_ads: 1 },
  ],
});
const detailResult = filterTikTokAds(detailList);
assert.deepStrictEqual(JSON.parse(detailResult.body).aweme_details.map((x) => x.aweme_id), ["normal"]);

const unchanged = JSON.stringify({ aweme_list: [{ aweme_id: "normal" }] });
const unchangedResult = filterTikTokAds(unchanged);
assert.strictEqual(unchangedResult.changed, false);
assert.strictEqual(unchangedResult.body, unchanged);

assert.throws(() => filterTikTokAds("not-json"));

console.log("TikTok clean local tests passed");
