# Shadowrocket 自托管隐私模块说明

更新时间：2026-08-30

## 目标

把原本依赖第三方 URL 的 Shadowrocket 功能模块改造成：

- 自己 GitHub 托管
- 能用纯规则就不用 JavaScript
- 不调用外部 Worker / API
- 不读取或上传 Cookie、账号、Token、播放 URL、设备密钥
- 不使用全局 `hostname = *` MITM
- 只在确实需要 URL Rewrite / Map Local 时追加最小 MITM 域名
- 主配置与功能模块分离，出问题可单独停用

## 已生成模块

### YouTube

`modules/youtube-adblock.sgmodule`

使用自写本地 protobuf 过滤器：

`scripts/youtube-adblock-local.js`

脚本不主动联网。

### TikTok

`modules/tiktok-clean.module`

当前稳定版采用纯 Rule：

- 拦截 TikTok 明确广告投放主机、广告落地页、analytics、log、mon 等统计/遥测主机
- 不拦截视频 CDN
- 不拦截 `mssdk`、`location`、`frontier` 等可能涉及账号安全、定位或实时通信的主机
- **当前不启用 MITM**，因此不会解密 TikTok 登录、私信、上传、支付等核心 API
- 无正在执行的 Script

已经准备自写本地过滤器：

`scripts/tiktok-clean-local.js`

以及回归测试：

`tests/tiktok-clean-local.test.js`

本地过滤器只识别 TikTok JSON 推荐流里明确标记 `is_ads / is_ad` 的项目；不修改下载权限、地区、会员、账号状态或其他业务字段。脚本当前故意不在模块中启用，等实际连接日志确认最小 API hostname 后再决定是否启用 MITM。

### 微信公众号

`modules/wechat-article-clean.module`

只处理公众号文章广告与商品推广接口：

- MITM：`mp.weixin.qq.com`
- 不包含 `*.weixin.qq.com`
- 不处理聊天、语音、登录、支付等微信核心流量
- 无 Script

### 小红书

`modules/xiaohongshu-clean.module`

拦截广告素材、惊喜弹窗、营销盒子及少量明确推广入口：

- MITM：`edith.xiaohongshu.com`、`www.xiaohongshu.com`
- 不 MITM `rec` / `so` / `ci` 等更多主机
- 不处理登录、私信、发布、支付
- 无 Script

由于不再运行社区版的小红书远程 JS，搜索页与信息流深度净化覆盖率会低一些，但供应链和隐私风险更低。

### 微博

`modules/weibo-clean.module`

轻量纯规则版：

- 无 MITM
- 无 Script
- 只拦截开屏广告、广告素材、广告投放与统计追踪专用域名
- 不解密 `api.weibo.cn` / `*.weibo.com`
- 不涉及会员功能

### 高德地图

`modules/amap-clean.module`

只处理开屏广告和营销增值接口：

- MITM：`m5.amap.com`
- 不拦截整个 `amap.com`
- 不修改导航、路线规划、实时路况规则
- 无 Script

如发现某个“增值服务”被误伤，可直接关闭此模块，不影响主配置。

### 淘宝

`modules/taobao-clean.module`

隐私优先轻量版：

- 主要阻断明确广告投放 / 统计域名
- MITM：仅 `guide-acs.m.taobao.com`
- 特意不 MITM `acs.m.taobao.com` 核心 API
- 不读取订单、支付、账号 Cookie / Token
- 无 Script

因此它不会像大型社区模块那样深度清理所有首页信息流广告，但本机解密范围明显更小。

### 京东

`modules/jd-clean.module`

纯规则版：

- 无 MITM
- 无 Script
- 只拦截明确广告投放与统计域名
- 不 MITM `api.m.jd.com`
- 不拦截 `dns.jd.com`
- 不修改价格、订单、会员或支付数据

### 闲鱼

`modules/xianyu-clean.module`

去开屏、广告曝光与部分营销推荐：

- MITM：`acs.m.goofish.com`、`g-acs.m.goofish.com`
- 无 Script
- 不读取或上传聊天、订单、支付、Cookie、Token

注意：闲鱼大量业务共用 `acs` 主机，因此开启该模块时 Shadowrocket 会在本机解密这两个主机的 HTTPS 流量。规则本身不会把数据发送到外部服务器，但如果你希望“零购物核心 API MITM”，应关闭此模块，只使用通用广告模块。

### 番茄小说

`modules/fanqie-adblock.module`

仅广告和追踪净化。采用纯 Rule + URL Rewrite，不使用第三方脚本。

为了减少误伤，没有照搬会拦截整个 `bytedance.com`、`snssdk.com` 等过宽规则。

### 七猫小说

`modules/qimao-adblock.module`

只实现广告 SDK 拦截，不包含会员、VIP、付费内容或签到奖励解锁。

### 通用广告

`modules/general-adblock-safe.module`

作为大型 `AdBlock.module / NoAd` 的隐私优先轻量替代。

特点：

- 无 Script
- 无 MITM
- 只拦截常见广告 / 统计 SDK 独立域名
- 避免封锁整个 `unity3d.com`、`qq.com`、`bytedance.com` 等正常业务大域

### 开屏广告

`modules/splash-adblock-safe.module`

作为 `adultraplus` 类模块的隐私优先轻量替代。

优先通过广告 SDK 独立域名阻断开屏广告，不进行大范围 HTTPS 解密。

由于故意减少 MITM 和大范围 Rewrite，覆盖率可能低于大型社区规则，但隐私、耗电和误伤风险更低。

### WEBTOON

`modules/webtoon-adblock.module`

基于用户原有规则重新收紧：

- 保留 WEBTOON 广告域名关键词
- 保留常见广告 SDK 独立域名
- 删除整个 `unity3d.com` 的阻断
- 删除过宽的 `is.com` 阻断
- 不需要 MITM

### 豌豆清单

`modules/wandou-privacy.module`

仅用于阻断常见广告 / 统计 SDK，减少设备标识符用于第三方广告追踪的机会。

不修改会员状态，不绕过订阅或 App 内购买。

## 当前 MITM 范围

启用对应模块时才追加：

- YouTube：`*.googlevideo.com`、`youtubei.googleapis.com` 等 YouTube 专用主机
- 微信公众号：`mp.weixin.qq.com`
- 小红书：`edith.xiaohongshu.com`、`www.xiaohongshu.com`
- 高德：`m5.amap.com`
- 淘宝：`guide-acs.m.taobao.com`
- 闲鱼：`acs.m.goofish.com`、`g-acs.m.goofish.com`

以下新增模块当前不需要 MITM：

- TikTok 稳定版
- 微博
- 京东
- 通用广告
- 开屏广告
- WEBTOON
- 豌豆清单

## 为什么不直接镜像原模块

仅把第三方 `.module` 或 `.js` 原样复制到自己的 GitHub，只解决“上游以后偷偷改代码”的供应链风险，不能自动解决以下问题：

- 原脚本本身主动联网
- 读取 Cookie / Header / Token
- 把播放 URL 或客户端密钥发送到 Worker
- 大范围 MITM 解密
- 过宽域名拦截导致其他 App 异常

所以当前策略是“重写功能”，而不是“盲目镜像”。

## 关于旧模块

迁移完成并验证新模块后，建议在 Shadowrocket 中停用/删除原来的第三方模块：

- `whatshub.top/module/fanqie.module`
- `whatshub.top/module/qmxs.module`
- `whatshub.top/module/wdqd.module`
- `whatshub.top/module/adultraplus.module`
- `whatshub.top/module/AdBlock.module`
- 原 `web-toon.sgmodule`

不要同时启用旧模块和新模块做长期使用，否则会出现重复规则、重复 MITM 或无法判断是哪一套规则造成异常。

## 推荐启用顺序

1. 保留已经稳定的 YouTube 自托管模块。
2. 安装 `general-adblock-safe.module`，先测试日常 App。
3. TikTok 先使用 `tiktok-clean.module` 的无 MITM 稳定版，确认播放、登录、评论、私信正常。
4. 按需开启微信公众号、微博、京东这类较低风险模块。
5. 小红书、高德、淘宝逐个开启，每开启一个测试对应 App。
6. 闲鱼最后开启，因为它需要 MITM 两个业务核心 `acs` 主机。
7. 番茄 / 七猫 / WEBTOON / 豌豆按实际使用需求单独开启。

不要一次性启用全部模块。逐个安装、逐个测试更容易定位兼容性问题。

## 安全原则

GitHub 可以保存：

- `.module` / `.sgmodule`
- 自写 `.js`
- 测试代码
- 文档

禁止保存：

- Shadowrocket CA 私钥 / `.p12`
- CA 密码
- 机场订阅地址
- 节点链接
- 用户名 / 密码 / Cookie
- API Token / GitHub Token
