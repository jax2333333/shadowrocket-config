# shadowrocket-config

Shadowrocket 外出 4G / 5G 专用配置仓库。

## 配置文件

- `Jax-shadowrocket-v6.conf`
- 固定 Raw 地址：
  `https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/Jax-shadowrocket-v6.conf`

Shadowrocket 中可直接使用上述 Raw 地址更新配置；仓库后续提交更新后，该地址不变。

## 独立模块

### YouTube 去广告（MITM + 自写 Script）

- 模块：`modules/youtube-adblock.sgmodule`
- 自写脚本：`scripts/youtube-adblock-local.js`
- 回归测试：`tests/youtube-adblock-local.test.js`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/youtube-adblock.sgmodule`
- 教程：`docs/youtube-adblock-ios.md`

### 微信公众号净化

- 模块：`modules/wechat-article-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/wechat-article-clean.module`
- 只处理 `mp.weixin.qq.com` 的公众号文章广告/商品推广，不处理聊天、登录、支付。

### 小红书净化

- 模块：`modules/xiaohongshu-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/xiaohongshu-clean.module`
- 广告素材、惊喜弹窗、营销盒子与部分推广入口；无第三方脚本。

### 微博净化

- 模块：`modules/weibo-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/weibo-clean.module`
- 轻量纯规则，无 MITM；主要拦截开屏广告、广告素材与统计追踪专用域名。

### 高德地图净化

- 模块：`modules/amap-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/amap-clean.module`
- 只处理开屏广告和营销增值接口，不改导航、路线、实时路况规则。

### 淘宝净化

- 模块：`modules/taobao-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/taobao-clean.module`
- 不 MITM `acs.m.taobao.com` 核心 API，只处理广告投放域名及 `guide-acs` 开屏营销接口。

### 京东净化

- 模块：`modules/jd-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/jd-clean.module`
- 轻量纯规则，无 MITM；不解密 `api.m.jd.com`，不修改订单、价格或支付数据。

### 闲鱼净化

- 模块：`modules/xianyu-clean.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/xianyu-clean.module`
- 去开屏、广告曝光与部分推荐营销；无第三方脚本。

### 番茄小说去广告

- 模块：`modules/fanqie-adblock.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/fanqie-adblock.module`

### 七猫小说去广告

- 模块：`modules/qimao-adblock.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/qimao-adblock.module`
- 仅广告/追踪净化，不包含会员、VIP、付费内容解锁。

### 通用广告拦截

- 模块：`modules/general-adblock-safe.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/general-adblock-safe.module`
- 轻量纯规则，无 Script、无 MITM。

### 开屏广告拦截

- 模块：`modules/splash-adblock-safe.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/splash-adblock-safe.module`
- 作为 adultraplus 类模块的隐私优先轻量替代。

### WEBTOON 去广告

- 模块：`modules/webtoon-adblock.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/webtoon-adblock.module`

### 豌豆清单隐私保护

- 模块：`modules/wandou-privacy.module`
- Raw：`https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/wandou-privacy.module`
- 只减少广告/统计追踪，不修改会员状态或 App 内购买。

### 隐私模块说明

- `docs/privacy-modules.md`

所有新增模块都优先采用 **自写 / 自托管 / 最小 MITM** 原则：能用 Rule / Map Local / Rewrite 完成的功能不引入 JavaScript；不会调用第三方 Worker 或 API，也不会主动上传 Cookie、账号信息、Token、播放 URL 或设备密钥。

## 当前版本

**Shadowrocket V6.2**

本版本依据 2026-08-29 的 `3.2.db` / `3.3.db` 实际连接日志审计更新，重点处理：

- 微信 / QQ 核心域名强制直连，降低语音、登录等流量落入代理的概率
- Apple / iCloud 核心域名及 Apple `17.0.0.0/8` 强制直连
- 修复 `gateway.icloud.com`、iCloud CalDAV / Contacts 等落入 FINAL 走代理的问题
- TikTok 与抖音共享 ByteDance 域名冲突时优先保证 TikTok 出口安全
- TikTok 核心域名固定走日本节点；抖音明确域名保持直连
- `zijieapi` / `bytedance.com` 等冲突或遥测域名继续拦截
- 网易爆米花 `filmly.netease.com` 明确直连
- 修复手动选择策略正则末尾多余空格

## 安全原则

本仓库只保存规则、策略组、DNS 与通用配置。

请不要提交：

- 机场订阅地址
- `ss://` / `vmess://` / `vless://` / `trojan://` 等完整节点链接
- 用户名、密码
- API Token / GitHub Token
- 私钥或证书私钥
- Shadowrocket CA / `.p12` / CA 密码

敏感订阅信息与 HTTPS 解密证书必须继续保存在 Shadowrocket / iPhone 本地。
