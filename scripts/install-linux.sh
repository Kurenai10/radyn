#!/usr/bin/env bash
# Radyn'i Linux'ta kullanıcı dizinine kurar (kök yetkisi gerekmez).
# Kullanım: ./scripts/install-linux.sh [paketlenmiş_klasör]
# Varsayılan kaynak: dist/linux-unpacked  (önce `npm run dist:linux` veya `npx electron-builder --linux dir` çalıştırın)
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
src="${1:-$here/dist/linux-unpacked}"
dest="$HOME/.local/share/radyn"
apps="$HOME/.local/share/applications"
icons="$HOME/.local/share/icons/hicolor/512x512/apps"

if [ ! -x "$src/radyn" ] && [ ! -f "$src/radyn" ]; then
  echo "Hata: '$src' içinde radyn bulunamadı. Önce paketleyin: npx electron-builder --linux dir" >&2
  exit 1
fi

mkdir -p "$dest" "$apps" "$icons"
cp -r "$src"/. "$dest"/
chmod +x "$dest/radyn"
[ -f "$dest/chrome-sandbox" ] && chmod 755 "$dest/chrome-sandbox" || true

cp "$here/assets/icon.png" "$icons/radyn.png"
sed "s#/home/USER/.local/share/radyn#$dest#" "$here/packaging/radyn.desktop" > "$apps/radyn.desktop"
chmod +x "$apps/radyn.desktop"
command -v update-desktop-database >/dev/null && update-desktop-database "$apps" || true

echo "Radyn kuruldu: $dest"
echo "Uygulama menüsünde 'Radyn' olarak görünür. Çalıştırmak için: $dest/radyn"
