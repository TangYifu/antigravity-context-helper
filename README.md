# Antigravity Context Helper

一个适用于 macOS 的 Antigravity 客户端上下文阈值助手。它在用户登录后运行，等待 Antigravity 打开，并通过应用的本机 DevTools 接口向窗口注入配置补丁。它不修改 Antigravity 的应用包。

> **重要：这只调整客户端的上下文检查阈值，不会改变模型或服务端的真实上下文上限。尚未验证超过 256K tokens 的真实请求是否被服务端接受。** 本项目是非官方工具，可能在应用升级后失效，也可能对应用稳定性产生影响。

## 工作原理

- 使用本机 `DevToolsActivePort`，校验监听端口属于 Antigravity 进程，仅连接本机窗口。
- 支持检测 2.x 版本号，并在注入前检查内部接口及模型枚举；已在 2.32.1 上用配置模拟验证。**不能保证所有 2.x 版本兼容**。
- 对脚本中列出的 Gemini 模型设置 983,040 tokens 阈值，对列出的 Claude 模型设置 868,928 tokens；未列出的模型不调整。模型对应内部 ID，未来更新可能发生变化。
- 日志显示 `Active` 表示模拟配置检查通过，不代表真实长上下文请求成功。若界面不兼容，助手会跳过注入并显示系统通知。

## 安装

需要 macOS、安装于 `/Applications/Antigravity.app` 的 Antigravity、Python 3 和 Node.js 22 或更新版本（安装后仍须保留所选 Node 路径）。该应用需要暴露本机 DevTools 端口；若未启用，助手会等待，不会自行开启端口。建议使用前关闭 Antigravity 并保存工作。

```sh
git clone https://github.com/TangYifu/antigravity-context-helper.git
cd antigravity-context-helper
python3 install.py
```

安装脚本不会覆盖已存在的同名助手或启动项；如果已安装，请先检查并自行处理旧版本。安装后重新打开 Antigravity；从状态日志查看结果：

```sh
tail -f "$HOME/Library/Application Support/AntigravityContextHelper/helper.log"
```

## 停用和卸载

先退出 Antigravity 以清除已注入到窗口内存的补丁。然后执行以下命令：

```sh
launchctl bootout "gui/$(id -u)/local.antigravity.context-helper"
rm "$HOME/Library/LaunchAgents/local.antigravity.context-helper.plist"
rm -r "$HOME/Library/Application Support/AntigravityContextHelper"
```

卸载会删除该助手的脚本和日志。重新打开 Antigravity 后不再注入。

## 安全和局限

助手使用 Chrome DevTools Protocol 执行 JavaScript，能够访问目标窗口的运行环境；本机调试接口本身需要谨慎保护。助手只连接 `127.0.0.1` 并检查端口的进程归属，但不提供针对恶意本机进程的完整隔离。应用内部接口没有稳定性保证；客户端阈值增大也可能导致错误、性能问题或更高的请求开销。

本项目与 Google 和 Antigravity 官方无关。许可证见 [LICENSE](LICENSE)。
