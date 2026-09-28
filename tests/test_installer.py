"""Exercise the packaged curl | bash path without public network or user preferences."""
import hashlib
import os
import re
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = 'currency-exchange.1h.sh'
VERSION = re.search(r'<xbar.version>(.*?)</xbar.version>', (ROOT / PLUGIN).read_text())[1]


class InstallerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.package_temp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.package_temp.cleanup)
        cls.package = Path(cls.package_temp.name) / 'release'
        subprocess.run(['/bin/bash', str(ROOT / 'scripts/package-release.sh'),
                        VERSION, str(cls.package)], check=True, capture_output=True)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='currency installer ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.assets = self.root / 'release'
        shutil.copytree(self.package, self.assets)
        self.folder = self.root / 'SwiftBar Plugins'
        self.folder.mkdir()
        (self.folder / PLUGIN).write_text('existing plugin')
        (self.folder / 'other.1h.sh').write_text('unrelated plugin')
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        curl = self.bin / 'curl'
        curl.write_text('''#!/bin/bash
set -eu
if [[ "${FAIL_DOWNLOAD:-0}" == 1 ]]; then exit 22; fi
output=''
while (( $# )); do
  case "$1" in
    --output) output="$2"; shift ;;
    https://*) url="$1" ;;
  esac
  shift
done
printf '%s\\n' "$url" >> "$URL_LOG"
case "$url" in
  https://github.com/Carlos-err406/currency-exchange-widget/releases/download/EXPECTED_VERSION/*)
    cp "$ASSETS/${url##*/}" "$output" ;;
  *) exit 2 ;;
esac
'''.replace('EXPECTED_VERSION', VERSION))
        curl.chmod(0o755)
        self.env = dict(os.environ, PATH=f'{self.bin}:/usr/bin:/bin:/usr/sbin:/sbin',
                        ASSETS=str(self.assets), URL_LOG=str(self.root / 'urls'))

    def install(self, script=None, **env):
        return subprocess.run(['/bin/bash', '-s', '--', str(self.folder)],
                              input=script if script is not None else (self.assets / 'install.sh').read_text(),
                              env=dict(self.env, **env), cwd=self.root, text=True,
                              capture_output=True, timeout=10)

    def assert_preserved(self):
        self.assertEqual((self.folder / PLUGIN).read_text(), 'existing plugin')
        self.assertEqual((self.folder / 'other.1h.sh').read_text(), 'unrelated plugin')
        self.assertEqual(len(list(self.folder.iterdir())), 2)

    def test_piped_installer_uses_pinned_assets_and_ignores_current_directory(self):
        (self.root / PLUGIN).write_text('untrusted neighboring script')
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.folder / PLUGIN).read_bytes(), (ROOT / PLUGIN).read_bytes())
        self.assertTrue(os.access(self.folder / PLUGIN, os.X_OK))
        self.assertEqual((self.folder / 'other.1h.sh').read_text(), 'unrelated plugin')
        self.assertEqual(len((self.root / 'urls').read_text().splitlines()), 2)

    def test_checksum_mismatch_preserves_installed_plugin(self):
        with (self.assets / PLUGIN).open('a') as f:
            f.write('\n# altered payload\n')
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('checksum mismatch', result.stderr)
        self.assert_preserved()

    def test_download_failure_preserves_installed_plugin(self):
        result = self.install(FAIL_DOWNLOAD='1')
        self.assertNotEqual(result.returncode, 0)
        self.assert_preserved()

    def test_missing_checksum_preserves_installed_plugin(self):
        (self.assets / 'SHA256SUMS').write_text('')
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('checksum', result.stderr)
        self.assert_preserved()

    def test_wrong_version_rejected_even_with_matching_checksum(self):
        file = self.assets / PLUGIN
        file.write_text(file.read_text().replace(VERSION, 'v0.0.0'))
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        (self.assets / 'SHA256SUMS').write_text(f'{digest}  {PLUGIN}\n')
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('version does not match', result.stderr)
        self.assert_preserved()

    def test_truncated_pipe_does_not_install(self):
        script = (self.assets / 'install.sh').read_text().split('\nmain "$@"')[0]
        self.install(script=script)
        self.assert_preserved()
        self.assertFalse((self.root / 'urls').exists())

    def test_archive_supports_offline_install(self):
        extracted = self.root / 'unpacked'
        extracted.mkdir()
        subprocess.run(['tar', '-xzf', str(self.assets / f'currency-exchange-{VERSION}.tar.gz'),
                        '-C', str(extracted)], check=True)
        result = subprocess.run(['/bin/bash', str(extracted / 'install.sh'), str(self.folder)],
                                env=dict(self.env, FAIL_DOWNLOAD='1'), capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.folder / PLUGIN).read_bytes(), (ROOT / PLUGIN).read_bytes())
        self.assertFalse((self.root / 'urls').exists())

    def test_packager_rejects_wrong_tag(self):
        result = subprocess.run(['/bin/bash', str(ROOT / 'scripts/package-release.sh'),
                                 'v0.0.0', str(self.root / 'wrong')], capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / 'wrong').exists())

    def test_packaged_checksums(self):
        result = subprocess.run(['shasum', '-a', '256', '-c', 'SHA256SUMS'],
                                cwd=self.assets, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
