#!/bin/bash
# Filled by scripts/package-release.sh in published installers.
RELEASE_VERSION=''

# Execute only after the complete script has arrived when piped from curl.
main() (
  set -euo pipefail
  umask 077
  PLUGIN='currency-exchange.1h.sh'
  REPOSITORY='Carlos-err406/currency-exchange-widget'

  fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }
  if [[ ${1:-} == '--help' ]]; then
    printf 'Usage: bash install.sh [SwiftBar plugin folder]\n'
    printf 'Installs or updates Currency Exchange in the existing SwiftBar plugin folder.\n'
    exit 0
  fi
  (( $# <= 1 )) || fail 'Expected at most one plugin folder.'
  [[ $(uname -s) == Darwin ]] || fail 'Currency Exchange requires macOS and SwiftBar.'

  destination=${1:-${SWIFTBAR_PLUGINS_PATH:-}}
  if [[ -z "$destination" ]]; then
    destination=$(defaults read com.ameba.SwiftBar PluginDirectory 2>/dev/null || true)
  fi
  [[ -n "$destination" ]] || fail 'Open SwiftBar and choose a plugin folder, then rerun this installer, or pass the folder as an argument.'
  # Match a literal tilde stored in SwiftBar preferences.
  # shellcheck disable=SC2088
  case "$destination" in '~/'*) destination="$HOME/${destination:2}" ;; esac

  work_dir=$(mktemp -d "${TMPDIR:-/tmp}/currency-exchange-install.XXXXXX")
  temporary=''
  trap 'rm -rf "$work_dir"; if [[ -n "$temporary" ]]; then rm -f "$temporary"; fi' EXIT
  source_dir=''
  # A piped installer must never trust a similarly named file in the current directory.
  if [[ -n ${BASH_SOURCE[0]:-} && -f ${BASH_SOURCE[0]} ]]; then
    source_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
  fi
  if [[ -n "$source_dir" && -f "$source_dir/$PLUGIN" ]]; then
    cp "$source_dir/$PLUGIN" "$work_dir/$PLUGIN"
    if [[ -f "$source_dir/SHA256SUMS" ]]; then
      cp "$source_dir/SHA256SUMS" "$work_dir/SHA256SUMS"
    elif [[ -n "$RELEASE_VERSION" ]]; then
      fail 'The release archive is missing SHA256SUMS. Download it again.'
    fi
  else
    [[ "$RELEASE_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]] ||
      fail 'Use install.sh from a published release, or run it from a complete checkout.'
    base_url="https://github.com/$REPOSITORY/releases/download/$RELEASE_VERSION"
    for asset in "$PLUGIN" SHA256SUMS; do
      curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
        --connect-timeout 10 --max-time 60 --retry 2 \
        --output "$work_dir/$asset" "$base_url/$asset"
    done
  fi

  if [[ -f "$work_dir/SHA256SUMS" ]]; then
    expected=$(awk -v name="$PLUGIN" '$2 == name {print $1}' "$work_dir/SHA256SUMS")
    [[ "$expected" =~ ^[a-f0-9]{64}$ ]] || fail 'Missing or invalid plugin checksum.'
    actual=$(shasum -a 256 "$work_dir/$PLUGIN" | awk '{print $1}')
    [[ "$actual" == "$expected" ]] || fail 'Plugin checksum mismatch; existing installation was not changed.'
  fi
  /bin/bash -n "$work_dir/$PLUGIN" || fail 'Invalid plugin script.'
  version=$(sed -n 's/.*<xbar.version>\(.*\)<\/xbar.version>.*/\1/p' "$work_dir/$PLUGIN")
  [[ "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]] || fail 'Missing or invalid plugin version.'
  [[ -z "$RELEASE_VERSION" || "$version" == "$RELEASE_VERSION" ]] || fail 'Plugin version does not match the installer release.'

  # Validate everything before touching an existing installation.
  mkdir -p "$destination"
  destination=$(cd "$destination" && pwd -P)
  temporary=$(mktemp "$destination/.currency-exchange.XXXXXX")
  cp "$work_dir/$PLUGIN" "$temporary"
  chmod 755 "$temporary"
  mv -f "$temporary" "$destination/$PLUGIN"
  printf 'Installed Currency Exchange %s\n%s\n' "$version" "$destination/$PLUGIN"
  printf 'SwiftBar discovers updates automatically while running. Launch SwiftBar if needed.\n'
)

main "$@"
