# Currency Exchange for SwiftBar

- This is a macOS SwiftBar plugin, not an Electron or React app.
- Keep the runtime standalone and compatible with macOS's bundled Bash 3.2 and
  command-line tools. Python is used only for tests.
- `currency-exchange.1h.sh` owns the download, cache, popup HTML, and SwiftBar output.
- Preserve the last valid image on download failure. Don't show refresh warnings;
  the **Updated** timestamp is the only staleness signal.
- Use the download timestamp only as a download timestamp; publication dates belong
  to the source image.
- Never modify unrelated SwiftBar plugins or preferences in the installer.
- Run `make check` on macOS after behavior changes. Run `shellcheck` when available.
- Keep the release tag aligned with `xbar.version` in the plugin script.
