#!/usr/bin/env python3
"""Install a per-user macOS LaunchAgent; never overwrite an existing installation."""
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys

LABEL = 'local.antigravity.context-helper'
ROOT = Path.home() / 'Library/Application Support/AntigravityContextHelper'
PLIST = Path.home() / 'Library/LaunchAgents' / (LABEL + '.plist')
SOURCE = Path(__file__).resolve().parent / 'src'

def main():
    if sys.platform != 'darwin':
        sys.exit('This helper currently supports macOS only.')
    if ROOT.exists() or PLIST.exists():
        sys.exit('An existing installation was found; no files were changed. Remove it manually after reviewing it, then retry.')
    node = shutil.which('node')
    if not node:
        sys.exit('Node.js 22 or newer is required on PATH.')
    version = subprocess.check_output([node, '-p', 'process.versions.node'], text=True).strip()
    if int(version.split('.')[0]) < 22:
        sys.exit('Node.js 22 or newer is required; found ' + version)
    if not Path('/Applications/Antigravity.app').exists():
        sys.exit('Expected /Applications/Antigravity.app was not found.')
    ROOT.mkdir(parents=True)
    plist_created = False
    try:
        for name in ('helper.cjs', 'argon1m-hook.js'):
            shutil.copy2(SOURCE / name, ROOT / name)
        PLIST.parent.mkdir(parents=True, exist_ok=True)
        config = {'Label': LABEL, 'ProgramArguments': [node, str(ROOT / 'helper.cjs')],
                  'RunAtLoad': True, 'KeepAlive': True,
                  'StandardOutPath': str(ROOT / 'helper.log'),
                  'StandardErrorPath': str(ROOT / 'error.log')}
        with PLIST.open('xb') as f:
            plist_created = True
            plistlib.dump(config, f)
        subprocess.run(['launchctl', 'bootstrap', f'gui/{os.getuid()}', str(PLIST)], check=True)
    except Exception:
        if plist_created:
            PLIST.unlink(missing_ok=True)
        shutil.rmtree(ROOT)
        raise
    print('Installed and started. Open Antigravity; check helper.log for status.')

if __name__ == '__main__':
    main()
