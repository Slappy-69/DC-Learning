// Electron fuses for the desktop builds (switches compiled into the Electron binary), shared by build and test.
// Flipped: no "run as Node" mode, no NODE_OPTIONS, no --inspect, app code only from app.asar, no extra file://
// privileges. Cookie encryption (keychain prompts on macOS; the app uses no cookies) and embedded ASAR integrity
// (meaningful with code signing; cannot be launch-tested here for Windows or macOS) stay off.
import { FuseV1Options, FuseVersion, getCurrentFuseWire } from '@electron/fuses';

export const FUSES = {
  version: FuseVersion.V1,
  strictlyRequireAllFuses: true,
  resetAdHocDarwinSignature: false,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableCookieEncryption]: false,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
  [FuseV1Options.WasmTrapHandlers]: true,
};

/** Expected state by name, for reports and tests. */
export const EXPECTED = Object.fromEntries(Object.entries(FUSES).filter(([k]) => /^\d+$/.test(k)).map(([k, v]) => [FuseV1Options[k], v]));

/** Fuse states as booleans ("1" enabled, "0" disabled; anything else kept as the raw character). */
export async function readFuses(binary) {
  const wire = await getCurrentFuseWire(binary);
  return Object.fromEntries(Object.entries(wire).filter(([k]) => k !== 'version').map(([k, v]) => {
    const c = typeof v === 'number' ? String.fromCharCode(v) : String(v);
    return [FuseV1Options[k] || k, c === '1' ? true : c === '0' ? false : c];
  }));
}
