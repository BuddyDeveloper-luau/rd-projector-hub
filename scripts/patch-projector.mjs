import fs from 'node:fs';
import path from 'node:path';

const javaDir = path.join(process.cwd(), 'android/app/src/main/java/com/buddydeveloper/rdprojector');
fs.mkdirSync(javaDir, { recursive: true });
fs.copyFileSync('native-java/MainActivity.java', path.join(javaDir, 'MainActivity.java'));
fs.copyFileSync('native-java/StreamLauncherPlugin.java', path.join(javaDir, 'StreamLauncherPlugin.java'));

const manifestPath = path.join(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
let m = fs.readFileSync(manifestPath, 'utf8');
m = m.replace(/android:screenOrientation="[^"]*"/g, 'android:screenOrientation="landscape"');
if (!m.includes('LEANBACK_LAUNCHER')) {
  m = m.replace(
    '<category android:name="android.intent.category.LAUNCHER" />',
    '<category android:name="android.intent.category.LAUNCHER" />\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />'
  );
}
if (!m.includes('android.software.leanback')) {
  m = m.replace(
    '<application',
    '<uses-feature android:name="android.software.leanback" android:required="false" />\n    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n    <application'
  );
}
fs.writeFileSync(manifestPath, m);
console.log('[patch-projector] Installed StreamLauncherPlugin & Leanback TV manifest.');
