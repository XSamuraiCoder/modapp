// electron-builder afterPack hook (macOS only): VMP-sign with castLabs EVS BEFORE
// Apple code-signing, which electron-builder does right after afterPack.
// Wired up as:  "afterPack": "build/evs-sign-mac.js"
const { vmpSign } = require('./evs-sign');

exports.default = async function evsSignMac(context) {
  if (context.electronPlatformName !== 'darwin') return;
  vmpSign(context);
};