#!/bin/bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$root"
version=$(sed -n 's/.*<xbar.version>\(.*\)<\/xbar.version>.*/\1/p' currency-exchange.1h.sh)
[[ "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]] || { printf 'Invalid plugin version\n' >&2; exit 1; }
[[ ${1:-} == "$version" ]] || { printf 'Release tag must match plugin version %s\n' "$version" >&2; exit 1; }
output=${2:-dist/$version}
mkdir -p "$output"
output=$(cd "$output" && pwd -P)
[[ "$output" != "$root" ]] || { printf 'Output must not be the repository root\n' >&2; exit 1; }
cp currency-exchange.1h.sh README.md "$output/"
mkdir -p "$output/docs/screenshots"
cp docs/screenshots/*.png "$output/docs/screenshots/"
sed "s/^RELEASE_VERSION=''$/RELEASE_VERSION='$version'/" install.sh > "$output/install.sh"
chmod 755 "$output/install.sh" "$output/currency-exchange.1h.sh"
cd "$output"
shasum -a 256 currency-exchange.1h.sh install.sh README.md > SHA256SUMS
archive="currency-exchange-$version.tar.gz"
tar -czf "$archive" currency-exchange.1h.sh install.sh README.md SHA256SUMS docs/screenshots
# The archive contains the checksums of its contents. The published manifest also checks the archive.
shasum -a 256 "$archive" >> SHA256SUMS
printf 'Packaged %s in %s\n' "$version" "$output"
