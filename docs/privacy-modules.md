# Shadowrocket 自托管隐私模块说明

更新时间：2026-08-30

## 目标

把原本依赖第三方 URL 的 Shadowrocket 功能模块改造成：

- 自己 GitHub 托管
- 能用纯规则就不用 JavaScript
- 不调用外部 Worker / API
- 不读取或上传 Cookie、账号、Token、播放 URL、设备密钥
- 不使用全局 `hostname = *` MITM
- 只在确实需要 URL Rewrite 时追加最小 MITM 域名
- 主配置与功能模块分离，出问题可单独停用

## 已生成模块

### YouTube

`modules/youtube-adblock.sgmodule`

使用自写本地 protobuf 过滤器：

`scripts/youtube-adblock-local.js`

这是唯一需要自写 JS 的模块；脚本不主动联网。

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

1. 先保留 YouTube 自托管模块。
2. 安装 `general-adblock-safe.module`，测试 1 天。
3. 如果仍有明显开屏广告，再加 `splash-adblock-safe.module`。
4. 番茄 / 七猫 / WEBTOON 按实际使用需求单独开启。
5. 豌豆清单只有在需要减少广告追踪时开启。

这样比一次性启用全部模块更容易定位兼容性问题。

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
