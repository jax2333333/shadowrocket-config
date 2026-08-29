# shadowrocket-config

Shadowrocket 外出 4G / 5G 专用配置仓库。

## 配置文件

- `Jax-shadowrocket-v6.conf`
- 固定 Raw 地址：
  `https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/Jax-shadowrocket-v6.conf`

Shadowrocket 中可直接使用上述 Raw 地址更新配置；仓库后续提交更新后，该地址不变。

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

敏感订阅信息建议继续保存在 Shadowrocket 本地。
