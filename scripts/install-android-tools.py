"""Install a workspace-local JDK and Android build toolchain; no system settings changed."""
import hashlib
import json
import os
import shutil
import subprocess
import urllib.request
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tools = root / '.tools'
tools.mkdir(exist_ok=True)

def download(url, target, checksum):
    if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != checksum:
        print(f'Downloading {target.name}', flush=True)
        urllib.request.urlretrieve(url, target)
    if hashlib.sha256(target.read_bytes()).hexdigest() != checksum:
        raise RuntimeError(f'Checksum verification failed for {target.name}')

request = urllib.request.Request('https://api.github.com/repos/adoptium/temurin21-binaries/releases/latest', headers={'User-Agent':'Tally-build'})
with urllib.request.urlopen(request) as response:
    assets = json.load(response)['assets']
package = next(a for a in assets if a['name'].startswith('OpenJDK21U-jdk_x64_windows_hotspot_') and a['name'].endswith('.zip'))
checksum_asset = next(a for a in assets if a['name'] == package['name'] + '.sha256.txt')
with urllib.request.urlopen(checksum_asset['browser_download_url']) as response:
    checksum = response.read().decode().split()[0]
jdk = {'name':package['name'],'link':package['browser_download_url'],'checksum':checksum}
jdk_archive = tools / jdk['name']
download(jdk['link'], jdk_archive, jdk['checksum'])
with zipfile.ZipFile(jdk_archive) as archive:
    jdk_folder = tools / archive.namelist()[0].split('/')[0]
    if not (jdk_folder / 'bin/java.exe').exists(): archive.extractall(tools)

sdk_archive = tools / 'commandlinetools-win-15859902_latest.zip'
download('https://dl.google.com/android/repository/' + sdk_archive.name, sdk_archive, '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a')
sdk = tools / 'android-sdk'
latest = sdk / 'cmdline-tools/latest'
if not (latest / 'bin/sdkmanager.bat').exists():
    with zipfile.ZipFile(sdk_archive) as archive: archive.extractall(tools / 'android-download')
    shutil.copytree(tools / 'android-download/cmdline-tools', latest, dirs_exist_ok=True)
env = os.environ.copy()
env.update(JAVA_HOME=str(jdk_folder), ANDROID_HOME=str(sdk), ANDROID_USER_HOME=str(tools / 'android-user'), GRADLE_USER_HOME=str(tools / 'gradle'))
env['PATH'] = str(jdk_folder / 'bin') + os.pathsep + env['PATH']
manager = str(latest / 'bin/sdkmanager.bat')
print('Installing Android SDK platform and build tools into .tools/android-sdk', flush=True)
subprocess.run([manager, f'--sdk_root={sdk}', '--licenses'], input='y\n' * 100, text=True, env=env, check=True, stdout=subprocess.DEVNULL)
subprocess.run([manager, f'--sdk_root={sdk}', 'platform-tools', 'platforms;android-36', 'build-tools;36.0.0'], env=env, check=True)
(tools / 'android-env.json').write_text(json.dumps({'JAVA_HOME':str(jdk_folder),'ANDROID_HOME':str(sdk),'ANDROID_USER_HOME':env['ANDROID_USER_HOME'],'GRADLE_USER_HOME':env['GRADLE_USER_HOME']}), encoding='utf-8')
print('Android build tools are ready.', flush=True)
