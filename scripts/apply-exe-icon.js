/* 鐢?rcedit 鎶婂浘鏍囦笌鐗堟湰淇℃伅鍐欏叆宸叉墦鍖呯殑 exe */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const rcedit = path.join(root, 'build', 'rcedit-x64.exe');
const icon = path.join(root, 'build', 'icon.ico');
const targets = [
  path.join(root, 'release', 'win-unpacked', 'JT Player.exe'),
];

function apply(exe) {
  if (!fs.existsSync(exe)) {
    console.warn('[icon] skip, missing', exe);
    return false;
  }
  if (!fs.existsSync(rcedit)) {
    console.warn('[icon] missing rcedit', rcedit);
    return false;
  }
  const args = [
    exe,
    '--set-icon', icon,
    '--set-version-string', 'FileDescription', 'JT Player 闈欏惉',
    '--set-version-string', 'ProductName', 'JT Player 闈欏惉',
    '--set-version-string', 'CompanyName', 'JT Player',
    '--set-version-string', 'InternalName', 'JT Player',
    '--set-version-string', 'OriginalFilename', 'JT Player.exe',
    '--set-file-version', '0.2.4',
    '--set-product-version', '0.2.4',
  ];
  const r = spawnSync(rcedit, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('[icon] rcedit failed', r.status, exe);
    return false;
  }
  console.log('[icon] ok', exe);
  return true;
}

let ok = true;
for (const t of targets) ok = apply(t) && ok;
process.exit(ok ? 0 : 1);

