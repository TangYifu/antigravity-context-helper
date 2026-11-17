# Antigravity Context Helper

[简体中文](README.md) | English

A macOS helper that adjusts client-side context thresholds in Antigravity. It runs after user login, waits for Antigravity to open, and injects a configuration patch into its window through the app's local DevTools interface. It does not modify the Antigravity application bundle.

> **Important: This only changes client-side context thresholds. It does not increase the actual context limit of a model or server. Real requests exceeding 256K tokens have not been verified.** This is an unofficial tool; app updates may break it, and it may affect app stability.

## How it works

- Reads the local `DevToolsActivePort`, checks that the listening port belongs to the Antigravity process, and connects only to local windows.
- Recognizes 2.x version numbers and checks internal interfaces and model enums before injection. Configuration simulations passed on 2.32.1; **compatibility with every 2.x version is not guaranteed**.
- Sets a threshold of 983,040 tokens for the Gemini models listed in the script and 868,928 tokens for the listed Claude models. Other models are unchanged. These mappings use internal model IDs, which may change in future updates.
- `Active` in the log means the simulated configuration checks passed; it does not mean a real long-context request succeeded. If the interface is incompatible, the helper skips injection and shows a system notification.

## Installation

You need macOS, Antigravity installed at `/Applications/Antigravity.app`, Python 3, and Node.js 22 or later. Keep the selected Node executable at the same path after installation. The app must expose a local DevTools port; if it does not, the helper waits and does not enable one itself. Save your work and close Antigravity before installing.

```sh
git clone https://github.com/TangYifu/antigravity-context-helper.git
cd antigravity-context-helper
python3 install.py
```

The installer will not overwrite an existing helper or LaunchAgent with the same name. If one is already installed, inspect it and handle the old installation yourself first. After installation, reopen Antigravity and check the status log:

```sh
tail -f "$HOME/Library/Application Support/AntigravityContextHelper/helper.log"
```

## Disable and uninstall

First quit Antigravity to remove the patch already injected into window memory. Then run:

```sh
launchctl bootout "gui/$(id -u)/local.antigravity.context-helper"
rm "$HOME/Library/LaunchAgents/local.antigravity.context-helper.plist"
rm -r "$HOME/Library/Application Support/AntigravityContextHelper"
```

Uninstalling removes the helper's scripts and logs. The patch will no longer be injected when you reopen Antigravity.

## Security and limitations

The helper uses the Chrome DevTools Protocol to execute JavaScript and can access the target window's runtime environment. The local debugging interface itself should be protected. The helper connects only to `127.0.0.1` and checks port ownership, but this does not provide complete isolation from malicious local processes. Internal app interfaces are not stable APIs, and increasing client-side thresholds may cause errors, performance issues, or higher request costs.

This project is not affiliated with Google or the Antigravity team. See [LICENSE](LICENSE) for license terms.
