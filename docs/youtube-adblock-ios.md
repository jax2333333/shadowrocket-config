# iPhone Shadowrocket + MITM + YouTube 去广告教程

> 适用目标：iPhone 上继续使用官方 YouTube / YouTube Music App，通过 Shadowrocket 独立模块尽量过滤片头和中途插播广告。
>
> 该方案不是 YouTube Premium 的等价替代。YouTube 接口或广告投放方式变化后，模块可能暂时失效，也可能导致视频加载异常。出现问题时可直接关闭模块，不影响主配置。

## 1. 方案结构

```text
Shadowrocket 主配置
├─ 原有代理 / DNS / YouTube 分流
└─ modules/youtube-adblock.sgmodule
   ├─ UDP/QUIC 阻断
   ├─ URL Rewrite
   ├─ YouTube API Response Script
   └─ MITM hostname（仅追加 YouTube 相关域名）
```

本方案不修改 `Jax-shadowrocket-v6.conf`，模块可以独立开启、关闭和更新。

## 2. 模块地址

固定 Raw 地址：

```text
https://raw.githubusercontent.com/jax2333333/shadowrocket-config/main/modules/youtube-adblock.sgmodule
```

以后仓库更新模块时，Raw 地址保持不变。

## 3. 在 Shadowrocket 中安装模块

1. 打开 Shadowrocket。
2. 进入「配置 / Config」页面。
3. 打开「模块 / Modules」。
4. 点击右上角 `+`。
5. 粘贴上面的 Raw 地址。
6. 下载并启用 `JAX - YouTube AdBlock`。
7. 确认 Shadowrocket 的全局路由使用「配置 / Config」模式。

如果模块已经安装，后续只需要在模块页面执行更新即可，不需要重新导入主配置。

## 4. 生成 Shadowrocket HTTPS 解密证书

MITM 脚本要读取并修改 YouTube HTTPS API 返回内容，因此必须启用 HTTPS 解密。

在 Shadowrocket 中：

1. 进入「设置」。
2. 找到「HTTPS 解密 / HTTPS Decryption」。
3. 进入证书管理。
4. 生成新的 Shadowrocket CA 证书。
5. 按 Shadowrocket 提示安装证书描述文件。

不同 Shadowrocket / iOS 版本的菜单文字可能略有差异，但核心是：生成本机 CA → 安装描述文件 → iOS 完全信任该 CA。

## 5. 在 iOS 中安装并完全信任证书

完成 Shadowrocket 的证书安装提示后：

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

只有“安装证书”而没有“完全信任”，MITM 通常不会正常工作。

## 6. 开启 HTTPS 解密

回到 Shadowrocket：

```text
设置
→ HTTPS 解密
→ 开启
```

本模块使用：

```text
hostname = %APPEND% -redirector*.googlevideo.com,*.googlevideo.com,s.youtube.com,www.youtube.com,youtubei.googleapis.com
```

`%APPEND%` 表示追加域名，而不是覆盖主配置或其他模块已有的 MITM 域名。

本方案不会把 `*.apple.com`、`*.icloud.com`、银行、支付等无关域名加入 MITM。

## 7. 第一次测试

完成以上步骤后：

1. 关闭 YouTube App（从后台划掉）。
2. 确认 Shadowrocket 已连接。
3. 确认 `JAX - YouTube AdBlock` 模块已开启。
4. 重新打开官方 YouTube App。
5. 连续测试几条平时容易出现片头广告的视频。
6. 再播放较长视频，观察中插广告。

建议同时测试：

- 普通长视频
- Shorts
- YouTube Music
- 1080p / 4K 视频
- 拖动进度条

## 8. 如何判断是否正常

正常时通常表现为：

- YouTube 视频可以正常加载。
- 原来的 `📹 YouTube` 分流仍然生效。
- 大部分片头广告消失。
- 大部分中插广告被过滤或跳过。
- 模块关闭后，YouTube 立即恢复为原始行为。

不能保证 100% 永久无广告。YouTube 改接口或服务端广告机制后，需要更新脚本或 Rewrite 规则。

## 9. 常见故障

### 模块装了但广告完全没变化

依次检查：

1. 模块是否启用。
2. Shadowrocket 是否处于「配置 / Config」路由模式。
3. HTTPS 解密是否开启。
4. Shadowrocket CA 是否已经安装。
5. iOS「证书信任设置」里是否开启完全信任。
6. 关闭并重新启动 YouTube App。

### YouTube 一直转圈 / 视频打不开

优先这样恢复：

```text
Shadowrocket
→ 配置
→ 模块
→ JAX - YouTube AdBlock
→ 关闭
```

然后强制退出 YouTube 再打开。

如果关闭模块后恢复正常，说明当前 YouTube 版本与模块规则暂时不兼容，不需要修改主配置。

### Shorts 或部分视频异常

YouTube 不同接口可能分批更新，因此会出现：

- 普通视频正常、Shorts 异常
- 片头广告能去、中插广告仍出现
- 某个账号正常、另一个账号不同

这通常不是节点或 DNS 配置损坏，而是脚本与 YouTube 当前 API 的兼容问题。

## 10. 安全原则

### 可以放 GitHub

- `.sgmodule` 模块
- Rewrite 规则
- Script URL
- 教程
- 开源脚本来源和许可证信息

### 不允许放 GitHub

- Shadowrocket CA 私钥
- CA 导出文件 / `.p12`
- CA 密码
- 机场订阅地址
- 节点链接
- 用户名、密码、Token

本仓库是公开仓库，所以证书和订阅必须只保存在本机。

## 11. 当前第三方脚本来源

当前模块引用固定版本：

```text
akiralereal/shadowrocket-toolkit
commit: 338320b364a0d6fb60fdeb60bb0407627085119b
scripts/youtube-response.js
```

该镜像仓库的来源说明指出，`youtube-response.js` 基于：

```text
Maasea/sgmodule
commit: 65075cdb388fc5e3094afd7e7314c67b243f3525
Script/Youtube/youtube.response.js
```

原脚本按 Apache License 2.0 授权。固定 commit 的目的，是避免直接引用 `main/master` 后脚本在未检查的情况下自动变化。

## 12. 后续更新原则

以后维护时：

1. 先检查当前 GitHub 正式版本。
2. 再检查 YouTube App 是否实际出现广告或播放异常。
3. 只有确实需要时才升级第三方脚本。
4. 升级前比较脚本差异和来源。
5. 更新后先测试片头、中插、Shorts、YouTube Music。
6. 主配置与 YouTube 去广告模块继续分离。

这样即使 YouTube 去广告规则失效，也不会破坏 Shadowrocket 原有代理、DNS 和应用分流配置。
