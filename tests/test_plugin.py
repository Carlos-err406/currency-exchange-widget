"""Integration tests: real shell/image validation, deterministic network responses."""

import base64
import os
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
from urllib.parse import unquote, urlparse
import zlib

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'currency-exchange.1h.sh'


def png():
    def chunk(kind, data):
        return (struct.pack('!I', len(data)) + kind + data
                + struct.pack('!I', zlib.crc32(kind + data)))
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('!2I5B', 2, 2, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(b'\0' + b'\x12\x80\xff' * 2
                                         + b'\0' + b'\x12\x80\xff' * 2))
            + chunk(b'IEND', b''))


class PluginTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='currency test ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.cache = self.root / "cache with 'quotes' | café"
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.fixture = self.root / 'fixture.png'
        self.fixture.write_bytes(png())
        downloader = self.bin / 'curl'
        downloader.write_text('''#!/bin/bash
if [[ "${FAIL_DOWNLOAD:-0}" == 1 ]]; then exit 22; fi
while (( $# )); do
  if [[ "$1" == --output ]]; then cp "$FIXTURE" "$2"; exit; fi
  shift
done
exit 2
''')
        downloader.chmod(0o755)
        self.env = dict(os.environ, PATH=f'{self.bin}:/usr/bin:/bin:/usr/sbin:/sbin',
                        SWIFTBAR_PLUGIN_CACHE_PATH=str(self.cache),
                        FIXTURE=str(self.fixture))

    def run_plugin(self, **env):
        result = subprocess.run(['/bin/bash', str(PLUGIN)], env=dict(self.env, **env),
                                text=True, capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout

    def html(self):
        return (self.cache / 'popup.html').read_text()

    def test_download_and_popup_contract(self):
        output = self.run_plugin()
        header = output.splitlines()[0]
        self.assertIn('webview=true', header)
        self.assertNotIn('⚠', header)
        url = header.split('href=')[1].split()[0]
        self.assertEqual(Path(unquote(urlparse(url).path)), self.cache.resolve() / 'popup.html')
        self.assertEqual((self.cache / 'rates.png').read_bytes(), png())
        self.assertIn(base64.b64encode(png()).decode(), self.html())
        self.assertIn('Updated ', self.html())
        self.assertIn('Refresh now | refresh=true', output)
        self.assertFalse(list(self.cache.glob('.refresh.*')))

    def test_offline_preserves_last_download_and_timestamp(self):
        self.run_plugin()
        image = self.cache / 'rates.png'
        os.utime(image, (1700000000, 1700000000))
        output = self.run_plugin(FAIL_DOWNLOAD='1')
        self.assertIn('⚠', output.splitlines()[0])
        self.assertEqual(image.read_bytes(), png())
        self.assertEqual(image.stat().st_mtime, 1700000000)
        self.assertIn('2023', self.html())
        self.assertIn('may be out of date', self.html())
        self.assertIn('data:image/png;base64,', self.html())

    def test_first_run_offline(self):
        self.run_plugin(FAIL_DOWNLOAD='1')
        self.assertIn('Rates unavailable', self.html())
        self.assertIn('No saved image yet', self.html())
        self.assertNotIn('<img ', self.html())

    def test_error_page_cannot_replace_cached_image(self):
        self.run_plugin()
        self.fixture.write_text('<html>Service unavailable</html>')
        self.run_plugin()
        self.assertEqual((self.cache / 'rates.png').read_bytes(), png())
        self.assertIn('may be out of date', self.html())

    def test_oversized_response_is_rejected(self):
        self.fixture.write_bytes(png() + b'\0' * 5242880)
        self.run_plugin()
        self.assertFalse((self.cache / 'rates.png').exists())
        self.assertIn('Rates unavailable', self.html())

    def test_truncated_png_is_rejected(self):
        self.fixture.write_bytes(png()[:40])
        self.run_plugin()
        self.assertFalse((self.cache / 'rates.png').exists())
        self.assertIn('Rates unavailable', self.html())

    def test_corrupt_cache_is_not_shown(self):
        self.cache.mkdir()
        (self.cache / 'rates.png').write_text('corrupt')
        self.run_plugin(FAIL_DOWNLOAD='1')
        self.assertIn('Rates unavailable', self.html())
        self.assertNotIn('<img ', self.html())

    def test_unwritable_cache_is_a_useful_menu(self):
        self.cache.write_text('a file, not a directory')
        output = self.run_plugin()
        self.assertIn('Cannot create the image cache.', output)
        self.assertIn('Refresh now | refresh=true', output)

    def test_new_download_replaces_old_copy(self):
        self.run_plugin()
        image = self.cache / 'rates.png'
        os.utime(image, (1700000000, 1700000000))
        self.run_plugin()
        self.assertGreater(image.stat().st_mtime, 1700000000)
        self.assertNotIn('Could not refresh', self.html())

    def test_installer_preserves_other_plugins_and_updates_in_place(self):
        folder = self.root / 'SwiftBar Plugins'
        folder.mkdir()
        other = folder / 'other.1h.sh'
        other.write_text('keep me')
        for _ in range(2):
            result = subprocess.run(['/bin/bash', str(ROOT / 'install.sh'), str(folder)],
                                    text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
        installed = folder / PLUGIN.name
        self.assertEqual(installed.read_bytes(), PLUGIN.read_bytes())
        self.assertTrue(os.access(installed, os.X_OK))
        self.assertEqual(other.read_text(), 'keep me')
        self.assertEqual(len(list(folder.iterdir())), 2)


if __name__ == '__main__':
    unittest.main()
