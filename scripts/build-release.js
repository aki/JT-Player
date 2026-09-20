/* JT Player release build: 先打包目录 → rcedit 写图标 → 再打 NSIS/便携版 */
const path = require('path');
const { spawnSync } = require('child_process');
const builder = require('electron-builder');

const projectDir = path.resolve(__dirname, '..');
const node = process.execPath;

process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.ELECTRON_MIRROR =
  process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/';
process.env.ELECTRON_BUILDER_BINARIES_MIRROR =
  process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
  'https://npmmirror.com/mirrors/electron-builder-binaries/';
process.env.npm_config_registry =
  process.env.npm_config_registry || 'https://registry.npmmirror.com';

const baseConfig = {
  npmRebuild: false,
  publish: null,
  win: {
    signAndEditExecutable: false,
    sign: null,
    signDlls: false,
  },
};

function runIconPatch() {
  const script = path.join(projectDir, 'scripts', 'apply-exe-icon.js');
  return spawnSync(node, [script], { stdio: 'inherit', cwd: projectDir }).status === 0;
}

function buildPackaged() {
  const winUnpacked = path.join(projectDir, 'release', 'win-unpacked');
  return builder.build({
    projectDir,
    prepackaged: winUnpacked,
    targets: builder.Platform.WINDOWS.createTarget(['nsis', 'portable'], builder.Arch.x64),
    config: baseConfig,
  });
}

builder
  .build({
    projectDir,
    targets: builder.Platform.WINDOWS.createTarget(['dir'], builder.Arch.x64),
    config: baseConfig,
  })
  .then(() => {
    if (!runIconPatch()) {
      throw new Error('rcedit icon patch failed');
    }
    return buildPackaged();
  })
  .then(() => {
    // 再确认一次目录版图标
    runIconPatch();
    console.log('\n[JT Player] Release build finished (icon applied). See release/ folder.');
  })
  .catch((err) => {
    console.error('\n[JT Player] Release build failed:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
