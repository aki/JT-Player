/* JT Player release build — programmatic electron-builder */
const path = require('path');
const builder = require('electron-builder');

const projectDir = path.resolve(__dirname, '..');

process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.ELECTRON_MIRROR =
  process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/';
process.env.ELECTRON_BUILDER_BINARIES_MIRROR =
  process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
  'https://npmmirror.com/mirrors/electron-builder-binaries/';
process.env.npm_config_registry =
  process.env.npm_config_registry || 'https://registry.npmmirror.com';

const winTargets = builder.Platform.WINDOWS.createTarget(
  ['nsis', 'portable'],
  builder.Arch.x64
);

builder
  .build({
    projectDir,
    targets: winTargets,
    config: {
      npmRebuild: false,
      publish: null,
      win: {
        signAndEditExecutable: false,
        sign: null,
      },
    },
  })
  .then(() => {
    console.log('\n[JT Player] Release build finished. See release/ folder.');
  })
  .catch((err) => {
    console.error('\n[JT Player] Release build failed:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
