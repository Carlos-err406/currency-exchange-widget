#!/bin/bash
# <xbar.title>Currency Exchange</xbar.title>
# <xbar.version>v3.0.0</xbar.version>
# <xbar.author>Carlos Daniel Vilaseca Illnait</xbar.author>
# <xbar.author.github>Carlos-err406</xbar.author.github>
# <xbar.desc>ElTOQUE's daily exchange-rate image in a menu bar popup, with an offline cache.</xbar.desc>
# <xbar.abouturl>https://github.com/Carlos-err406/currency-exchange-widget</xbar.abouturl>
# <swiftbar.persistentWebView>false</swiftbar.persistentWebView>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>

set -euo pipefail
export LC_ALL=C
umask 077

SOURCE_URL='https://wa.cambiocuba.money/trmi.png'
# Original Electron trayTemplate@2x.png, embedded to keep installation standalone.
TRAY_ICON='iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAJKADAAQAAAABAAAAJAAAAAAqDuP8AAAEo0lEQVRYCe2Yy4sVRxSH7/URjZpoNOrogDIiEd0EHyiCCONKUQIixo0IoyshEhfqRhfGf0A0wQSykwQEB9Eo4mNcKUggQVwpySJG0NFRJz5wHMfH9fvd1Jmcrlu3u8eNLnLgo06dR3VN3a7TVVOpvGdSHep8arXaJHImwEjorVarPUVjhJxPiHsBPeQ8K8op9DNoO5yAbuiDfrgNK1LJ2KuwHk6D5TxGvw4HYE4qr5SN5O0wACn5Jh6EoEnQmQp2tl70LXFuYZ+k1fAqGugK/d/gF2jzg9AfB13g5QEd5Wh1XjrHa/TNPj9XJ3gEXHYDHEWfCcOaJeLbBybPUHZDKwyD0bAU/IQf0v+s2XgZuwLhOUj+hvGZgKiDvwXugUSr2hGF1LvYx8AFMDmYimuwEb3cMmhPNAREBmK+dPFdkTvTJW4x2B/7B/qHCmi69CFbW9uk35Scdq7znXF6Sr2C8a/gmE47RXpmQsxyHpwCbctR+FU3TOo1C/sXcA62Qd1mAbSjnf7E6Sn1Jca+4BhO+4H0EcFgzXaU1aGjAvgz1EAP1vKuoT0CWt7l0AndYHLLFNrPnZ5StSIzguMxbW9DEA/cCF7029o2vYH+yDnPo/sVqdBfABbfg97W8JBgwLcHTM6ixKv9bySOHRaV017EV//N/QOxDQf9nCYqGbN9jHRsHaCSYLIujsn0icqblCYzOZPgOvgWgj4RJlqpH2Ar7AKtrJdjdOJXx40YVIJSk8qdjI1C7lpQwSsSTU7vajkh2E/qEv2mKxOPSOwiOAMvIJY7GFTRx8Z56RfJRZG0ga6+zN9zbLjnXKVU8hcSuARa4Tlcg0uM5Xcnpv+l3Ao0/clY6mkMsQz0OVDVVtH7laX+nXZIwlifkrAV/iRfhbW8kDwW9MLpxYtFL6he1EVlRyR2MmhDmOwsm6uCpZNeXCdsIN9qS68tGpgYTUalIpYdRbmajA5jKlJeNDkVMxU1FTcVORMVP+2gpOBrNhnLz58UUessklZlvSN+ErbZ4E+Q+kzoS50RbFMgtTKYM5KeFCG6IegDZ7In8wTXIaANbKX0IV3g3FppHVP9z66VvAESxeuD7WWjz6/rePXu3A1R92mnNgQ5A/5DIVbNV86lCbWAfTj70NfAYZDoUL8KflInyI8+3z5qEzF+HBw3aYsuf1fdIKrAXu7S2QU6O33HNj/FgzeFAJWZp6DrzwOYBfthUGxCA1heBesYWtn9aTG4BpuPBrVKJXO0ZQI60H0bsDDZTEYSo0/I12bwrR1htSK3g6ONdr4PSugrnU3fpiLxB7m8P/S/cVjWg/aj0uqKopVqEOw6XNnFUVeeloYgZ8A/Huyl1jF4SHcwf4bpInkpaNfoktcKu8FeWNTaPvfsjIpPOTNBl0sTlQx7TTLxyQ7Bm0E7wUTb9DroGqzrsBdNeJwfiL5KwnHQNVs5ur+baFXtAuHT8nWStoAfyAb0bSedhpMetr0+yOkD6LrRvJ2QPAd0N9PqqLCpnnTDadC/WJKnBOztoH/R9INy9IE+Ce1lZ5Ic2JIZSPcv3S50g/2H7arakSvkKF51TbvpYZmc3AHftfMNkDSf1L7W2dYAAAAASUVORK5CYII='
CACHE_DIR="${SWIFTBAR_PLUGIN_CACHE_PATH:-${HOME}/Library/Caches/currency-exchange-widget}"

error_menu() {
  printf '%s\n' "⚠ | templateImage=$TRAY_ICON width=18 height=18" '---' "$1" \
    'Refresh now | refresh=true' "Open source image | href=$SOURCE_URL"
}

if ! mkdir -p "$CACHE_DIR"; then
  error_menu 'Cannot create the image cache.'
  exit 0
fi
WORK_DIR=$(mktemp -d "$CACHE_DIR/.refresh.XXXXXX") || {
  error_menu 'Cannot write to the image cache.'
  exit 0
}
trap 'rm -rf "$WORK_DIR"' EXIT

# Reject HTTP error pages, oversized responses, and undecodable images before
# replacing the last good copy. sips is included with macOS.
valid_image() {
  local file="$1" dimensions width height signature
  [[ -s "$file" ]] || return 1
  [[ $(wc -c < "$file") -le 5242880 ]] || return 1
  signature=$(od -An -tx1 -N8 "$file" | tr -d ' \n')
  [[ "$signature" == '89504e470d0a1a0a' ]] || return 1
  dimensions=$(sips -g pixelWidth -g pixelHeight "$file" 2>/dev/null) || return 1
  width=$(printf '%s\n' "$dimensions" | awk '/pixelWidth:/{print $2}')
  height=$(printf '%s\n' "$dimensions" | awk '/pixelHeight:/{print $2}')
  [[ "$width" =~ ^[0-9]+$ && "$height" =~ ^[0-9]+$ ]] || return 1
  (( width > 0 && height > 0 && width <= 10000 && height <= 10000 ))
}

offline=false
if curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
  --connect-timeout 5 --max-time 15 --max-filesize 5242880 \
  --output "$WORK_DIR/download.png" "$SOURCE_URL" && valid_image "$WORK_DIR/download.png"; then
  # Rename on the same filesystem is atomic, including during concurrent refreshes.
  cp "$WORK_DIR/download.png" "$WORK_DIR/cache.png"
  mv -f "$WORK_DIR/cache.png" "$CACHE_DIR/rates.png"
else
  offline=true
  printf '%s\n' 'Currency Exchange: refresh failed; using the last valid image if available.' >&2
fi

image_html='<section class="empty"><h1>Rates unavailable</h1><p>Check your connection, then right-click the menu bar icon and choose Refresh now.</p></section>'
status='No saved image yet'
notice=''
title=' '
if [[ -f "$CACHE_DIR/rates.png" ]]; then
  cp -p "$CACHE_DIR/rates.png" "$WORK_DIR/snapshot.png"
  if valid_image "$WORK_DIR/snapshot.png"; then
    downloaded=$(date -r "$(stat -f %m "$WORK_DIR/snapshot.png")" '+%b %d, %Y at %H:%M %Z')
    status="Updated $downloaded"
    image_html="<img src=\"data:image/png;base64,$(base64 < "$WORK_DIR/snapshot.png" | tr -d '\r\n')\" alt=\"ElTOQUE daily currency exchange-rate chart\">"
  fi
fi
if [[ "$offline" == true ]]; then
  title='⚠'
  notice='<p class="notice">Could not refresh. Any saved image below may be out of date.</p>'
fi

# Inline the image so WebKit does not need access to adjacent files or a server.
# Recreate the WebView on each open so a refresh is visible on the next click.
cat > "$WORK_DIR/popup.html" <<HTML
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<title>Currency Exchange</title>
<style>
:root { color-scheme: light dark; font: 12px -apple-system, BlinkMacSystemFont, sans-serif; color: #424242; background: #fafafa; }
* { box-sizing: border-box; }
body { margin: 0; }
img { display: block; width: 100%; height: auto; }
footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 3px 9px 3px 12px; line-height: 18px; }
footer p { margin: 0; }
.refresh { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 24px; height: 24px; border-radius: 4px; color: inherit; }
.refresh:hover { background: rgba(128, 128, 128, .18); }
.refresh:active { background: rgba(128, 128, 128, .28); }
.refresh:focus-visible { outline: 2px solid #3885c5; outline-offset: 1px; }
.notice { margin: 0; padding: 12px 16px; background: #fff1cb; color: #634600; line-height: 1.5; }
.empty { padding: 70px 32px; text-align: center; line-height: 1.6; }
h1 { font-size: 20px; font-weight: 600; }
@media (prefers-color-scheme: dark) {
  :root { color: #e3e3e3; background: #202020; }
  .notice { background: #40351b; color: #ffe1a0; }
}
</style></head>
<body><main>$notice$image_html<footer><p>$status</p><a class="refresh" href="swiftbar://refreshplugin?name=currency-exchange.1h.sh" aria-label="Refresh rates" title="Refresh rates"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M19.5 12a7.5 7.5 0 1 0-2 5.1M20 12l-3-3"/></svg></a></footer></main></body></html>
HTML
mv -f "$WORK_DIR/popup.html" "$CACHE_DIR/popup.html"

# Percent-encode paths (including spaces, quotes, Unicode, and SwiftBar's | delimiter).
file_url() {
  local path="$1" char i
  printf 'file://'
  for ((i=0; i<${#path}; i++)); do
    char=${path:i:1}
    case "$char" in
      [a-zA-Z0-9/._~-]) printf '%s' "$char" ;;
      *) printf '%%%02X' "$(( $(printf '%d' "'$char") & 255 ))" ;;
    esac
  done
}
popup_url=$(file_url "$(cd "$CACHE_DIR" && pwd -P)/popup.html")
printf '%s\n' "$title | templateImage=$TRAY_ICON width=18 height=18 tooltip='Currency Exchange' href=$popup_url webview=true webvieww=500 webviewh=510" \
  '---' "$status" 'Refresh now | refresh=true' "Open source image | href=$SOURCE_URL" \
  'ElTOQUE | href=https://eltoque.com/'
