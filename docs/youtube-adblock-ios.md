# iPhone Shadowrocket + MITM + YouTube 去广告教程

> 适用目标：iPhone 上继续使用官方 YouTube / YouTube Music App，通过 Shadowrocket 独立模块尽量过滤片头、中途插播和 Shorts 广告。
>
> 当前版本为 **JAX 自写 / 自托管隐私优先版**。模块和 JS 都位于 `jax2333333/shadowrocket-config`，不再运行第三方远程 JS，也不调用外部 Worker。

## 1. 方案结构

```text
Shadowrocket 主配置
├─ 原有代理 / DNS / YouTube 分流
└─ modules/youtube-adblock.sgmodule
   ├─ UDP/QUIC 阻断
   ├─ URL Rewrite
   ├─ scripts/youtube-adblock-local.js
   │  └─ 本机 protobuf 广告字段过滤
   └─ MITM hostname（仅追加 YouTube 相关域名）
```

本方案不修改 `Jax-shadowrocket-v6.conf`，模块可以独立开启、关闭和更新。

## 2. 模块地址

固定 Raw 地址：

```text
https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/youtube-adblock.sgmodule
```

自托管 JS：

```text
https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/scripts/youtube-adblock-local.js
```

以后仓库更新模块或脚本时，Raw 地址保持不变。

## 3. 当前脚本做了什么

脚本不是大型第三方增强脚本，而是只实现去广告所需的最小 protobuf 处理：

- `/youtubei/v1/player`
  - 删除 `adPlacements`（field 7）
  - 删除 `adSlots`（field 68）
  - 删除 `playbackTracking.pageadViewthroughconversion`（field 18）
- `/youtubei/v1/get_watch`
  - 找到其中的 player 并执行相同过滤
- `/youtubei/v1/reel/reel_watch_sequence`
  - 删除 `adClientParams.isAd = true` 的 Shorts 条目

同时模块继续使用 URL Rewrite 阻断一部分传统广告播放和广告统计请求。

如果 protobuf 格式发生异常或 YouTube 改了协议，脚本采用 **Fail Open**：直接放行原始响应，优先保证视频能播放，而不是输出损坏的数据。

## 4. 隐私设计

当前 JS 明确不使用：

```text
fetch
$httpClient
$task.fetch
XMLHttpRequest
外部 Worker
```

也不使用持久化存储，不主动上传：

- Cookie
- Google / YouTube 账号信息
- 请求 Header
- 播放 URL
- 视频 ID
- 客户端播放密钥
- UMP / Onesie 密钥

脚本只处理 **Shadowrocket 已经在 iPhone 本机截获的当前响应数据**。

注意：因为 MITM 本身必须让 Shadowrocket 解密指定 YouTube HTTPS 流量，所以安全边界仍然包括 Shadowrocket App 和你自己安装的 Shadowrocket CA。CA 证书及私钥绝对不要上传 GitHub。

## 5. 在 Shadowrocket 中安装模块

1. 打开 Shadowrocket。
2. 进入「配置 / Config」。
3. 打开「模块 / Modules」。
4. 点击右上角 `+`。
5. 粘贴模块 Raw 地址。
6. 下载并启用 `JAX - YouTube AdBlock`。
7. 确认全局路由使用「配置 / Config」模式。

如果之前已经装过旧版模块，不用重新安装：在模块页面执行更新即可，更新后脚本地址会自动切换到你自己的 GitHub。

## 6. 生成 Shadowrocket HTTPS 解密证书

MITM 脚本要读取并修改 YouTube HTTPS API 返回内容，因此必须启用 HTTPS 解密。

在 Shadowrocket 中：

1. 进入「设置」。
2. 找到「HTTPS 解密 / HTTPS Decryption」。
3. 进入证书管理。
4. 生成新的 Shadowrocket CA 证书。
5. 按 Shadowrocket 提示安装证书描述文件。

不同 Shadowrocket / iOS 版本菜单文字可能略有差异，核心流程是：

```text
生成本机 CA
→ 安装描述文件
→ iOS 完全信任该 CA
→ 开启 Shadowrocket HTTPS 解密
```

## 7. 在 iOS 中安装并完全信任证书

### A. 安装描述文件

通常进入：

```text
设置
→ 通用
→ VPN 与设备管理 / 设备管理
→ 已下载的描述文件
→ Shadowrocket CA
→ 安装
```

### B. 开启完全信任

然后进入：

```text
设置
→ 通用
→ 关于本机
→ 证书信任设置
→ Shadowrocket CA
→ 开启「完全信任」
```

只有安装证书而没有开启完全信任，MITM 通常不会正常工作。

## 8. MITM 范围

模块只追加：

```text
-redirector*.googlevideo.com
*.googlevideo.com
s.youtube.com
www.youtube.com
youtubei.googleapis.com
```

使用 `%APPEND%`，不会覆盖主配置或其他模块已有的 MITM hostname。

不会主动把以下无关服务加入解密：

```text
*.apple.com
*.icloud.com
银行
支付
邮箱
其他 App
```

## 9. 第一次测试

完成以上步骤后：

1. 从后台彻底关闭 YouTube App。
2. 确认 Shadowrocket 已连接。
3. 确认 `JAX - YouTube AdBlock` 模块已开启。
4. 确认 HTTPS 解密已开启且 CA 已完全信任。
5. 重新打开官方 YouTube App。
6. 连续测试几条平时容易出现片头广告的视频。
7. 播放 10 分钟以上的视频观察中插广告。
8. 测试 Shorts。

建议额外测试：

- YouTube Music
- 1080p / 4K
- 拖动进度条
- Wi-Fi / 4G / 5G

## 10. 效果预期

当前自写版重点针对经典 protobuf 广告字段和常见广告 URL。

预期：

- 片头广告：有较高概率过滤
- 常规中插：有较高概率过滤
- Shorts 广告条目：可针对当前已知字段过滤
- 首页推广卡片：当前不是重点
- 新版 UMP / 加密 initplayback 服务端广告：不保证过滤

这里刻意不接入需要把播放 URL 或客户端密钥发给外部服务器的方案。隐私优先级高于追求 100% 去广告率。

## 11. 常见故障

### 模块装了但广告完全没变化

检查：

1. 模块是否启用。
2. 是否使用「配置 / Config」路由模式。
3. HTTPS 解密是否开启。
4. Shadowrocket CA 是否已安装。
5. iOS「证书信任设置」是否开启完全信任。
6. 模块是否已经更新到自托管版本。
7. 强制退出并重启 YouTube。

### YouTube 转圈 / 视频打不开

立即：

```text
Shadowrocket
→ 配置
→ 模块
→ JAX - YouTube AdBlock
→ 关闭
```

然后强制退出 YouTube 再打开。

脚本本身已设计为解析失败时原样放行；如果关闭模块才恢复，通常是 Rewrite / MITM 或 YouTube 新协议变化，需要重新检查规则。

### 中插仍偶尔出现

这并不一定说明脚本没运行。YouTube 正在使用多种广告投放方式，新版服务器端/加密播放流可能不再单纯依赖经典 `player` 广告字段。

此时优先收集 Shadowrocket 日志和实际请求路径，再增加 **本地处理规则**；不会为了追求去广告率直接接第三方 Worker。

## 12. 自动测试

仓库包含合成 protobuf 回归测试：

```text
tests/youtube-adblock-local.test.js
```

在电脑安装 Node.js 后可以运行：

```bash
node tests/youtube-adblock-local.test.js
```

当前测试覆盖：

- `player` 广告字段删除
- `get_watch` 内嵌 player 删除
- Shorts `isAd=true` 条目删除

每次修改 protobuf 过滤逻辑后，应先跑测试再提交正式版本。

## 13. GitHub 安全原则

### 可以放 GitHub

- `.sgmodule`
- 自写 JS
- Rewrite 规则
- 测试代码
- 教程

### 不允许放 GitHub

- Shadowrocket CA 私钥
- `.p12`
- CA 密码
- 机场订阅地址
- 节点链接
- 用户名、密码、Token

本仓库是公开仓库，所以证书和订阅必须只保存在设备本地。

## 14. 后续维护原则

以后更新时：

1. GitHub 仓库版本作为正式版本。
2. 修改前先读取仓库最新版。
3. 不从聊天旧代码直接覆盖。
4. 尽量保持脚本小型、可读、可审计。
5. 不新增任何第三方主动联网依赖。
6. 若确实需要联网能力，必须先明确说明数据会发送到哪里、发送什么，再决定是否启用。
7. 更新 protobuf 字段前先验证真实日志/样本。
8. 修改后运行回归测试。
9. 主配置与 YouTube 去广告模块继续分离。

这样即使 YouTube 改版导致去广告暂时失效，也不会破坏原来的 Shadowrocket 代理、DNS 和应用分流配置。
