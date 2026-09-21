const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const sdkRoot = process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));

if (!sdkRoot) {
  console.error('Android SDK not found. Set ANDROID_HOME or install the Android SDK.');
  process.exit(1);
}

const platformTools = join(sdkRoot, 'platform-tools');
const emulatorDir = join(sdkRoot, 'emulator');
const adb = join(platformTools, process.platform === 'win32' ? 'adb.exe' : 'adb');
const emulator = join(emulatorDir, process.platform === 'win32' ? 'emulator.exe' : 'emulator');

if (!existsSync(adb) || !existsSync(emulator)) {
  console.error(`Android SDK tools are missing under ${sdkRoot}.`);
  process.exit(1);
}

const env = {
  ...process.env,
  ANDROID_HOME: sdkRoot,
  ANDROID_SDK_ROOT: sdkRoot,
  PATH: `${platformTools}${process.platform === 'win32' ? ';' : ':'}${emulatorDir}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}`,
};

function run(command, args) {
  return spawnSync(command, args, { env, encoding: 'utf8', windowsHide: true });
}

function connectedDevice() {
  const result = run(adb, ['devices']);
  return result.stdout.split(/\r?\n/).some((line) => /\tdevice$/.test(line));
}

run(adb, ['start-server']);

if (!connectedDevice()) {
  const avds = run(emulator, ['-list-avds']).stdout
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (avds.length === 0) {
    console.error('No Android Virtual Device is installed. Create one in Android Studio Device Manager.');
    process.exit(1);
  }

  const emulatorProcess = spawn(emulator, ['-avd', avds[0]], {
    detached: true,
    stdio: 'ignore',
    env,
    windowsHide: true,
  });
  emulatorProcess.unref();
}

const deadline = Date.now() + 120000;
let bootReady = false;
while (Date.now() < deadline) {
  if (connectedDevice()) {
    const devices = run(adb, ['devices']).stdout;
    const serial = devices.match(/^(emulator-\d+)\tdevice$/m)?.[1];
    if (serial) {
      const boot = run(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']).stdout.trim();
      if (boot === '1') {
        bootReady = true;
        break;
      }
    }
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}

if (!bootReady) {
  console.error('Android emulator did not become available within 120 seconds.');
  process.exit(1);
}

const expo = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(expo, ['expo', 'start', '--android'], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);