#!/usr/bin/env bash
# Radyn — Linux kurulum betiği
#
# En son sürümün AppImage dosyasını GitHub'dan indirir, SHA-256 özetiyle doğrular,
# ~/.local/share/radyn altına kurar ve uygulama menüsüne kısayol ekler.
# Kök (sudo) yetkisi gerektirmez.
#
# Kullanım:
#   bash install-radyn.sh                     # en son sürümü kur (veya güncelle)
#   bash install-radyn.sh --version v1.1.0    # belirli bir sürümü kur
#   bash install-radyn.sh --uninstall         # kaldır (ayarlar korunur)
#   bash install-radyn.sh --help

set -euo pipefail

REPO="Kurenai10/radyn"
API="https://api.github.com/repos/${REPO}/releases"
RAW="https://raw.githubusercontent.com/${REPO}"

APP_DIR="${HOME}/.local/share/radyn"
APPIMAGE="${APP_DIR}/Radyn.AppImage"
BIN_DIR="${HOME}/.local/bin"
APPS_DIR="${HOME}/.local/share/applications"
ICON_DIR="${HOME}/.local/share/icons/hicolor/512x512/apps"
DESKTOP_FILE="${APPS_DIR}/radyn.desktop"
ICON_FILE="${ICON_DIR}/radyn.png"

say()  { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }
die()  { printf 'HATA: %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' komutu bulunamadı. Lütfen kurun ve tekrar deneyin."
}

# ---------------------------------------------------------------- kaldırma

uninstall() {
  say "Radyn kaldırılıyor..."
  rm -f "$APPIMAGE" "$DESKTOP_FILE" "$ICON_FILE" "$BIN_DIR/radyn"
  rmdir "$APP_DIR" 2>/dev/null || true
  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
  fi
  say "Kaldırıldı. Favorileriniz ve ayarlarınız (~/.config/Radyn) korundu; tamamen silmek için bu klasörü de silin."
  exit 0
}

# Kullanıcı ad alanları kısıtlıysa (Ubuntu 24.04+ gibi, AppArmor ile) Chromium sandbox'ı
# başlatamaz ve uygulama açılmaz. Yalnızca bu durumda --no-sandbox kullanılır.
userns_restricted() {
  local f
  f=/proc/sys/kernel/apparmor_restrict_unprivileged_userns
  if [ -r "$f" ] && [ "$(cat "$f")" = "1" ]; then return 0; fi
  f=/proc/sys/kernel/unprivileged_userns_clone
  if [ -r "$f" ] && [ "$(cat "$f")" = "0" ]; then return 0; fi
  f=/proc/sys/user/max_user_namespaces
  if [ -r "$f" ] && [ "$(cat "$f")" = "0" ]; then return 0; fi
  return 1
}

# ---------------------------------------------------------------- argümanlar

VERSION=""
case "${1:-}" in
  --help|-h) usage; exit 0 ;;
  --uninstall) uninstall ;;
  --version)
    [ -n "${2:-}" ] || die "--version için bir etiket verin (örn. v1.1.0)"
    VERSION="$2"
    ;;
  "") ;;
  *) die "Bilinmeyen seçenek: $1 (yardım için --help)" ;;
esac

# ---------------------------------------------------------------- ön koşullar

[ "$(uname -s)" = "Linux" ] || die "Bu betik yalnızca Linux içindir."
case "$(uname -m)" in
  x86_64|amd64) ;;
  *) die "Yalnızca 64-bit (x86_64) desteklenir; sisteminiz: $(uname -m)" ;;
esac

need curl
need sha256sum
need sed
need grep

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---------------------------------------------------------------- sürümü bul

if [ -n "$VERSION" ]; then
  RELEASE_URL="${API}/tags/${VERSION}"
else
  RELEASE_URL="${API}/latest"
fi

say "Sürüm bilgisi alınıyor ($RELEASE_URL)"
if ! JSON="$(curl -fsSL -H 'Accept: application/vnd.github+json' "$RELEASE_URL")"; then
  die "Sürüm bilgisi alınamadı. İnternet bağlantınızı ve sürüm etiketini kontrol edin."
fi

TAG="$(printf '%s\n' "$JSON" | grep -o '"tag_name": *"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')"
APPIMAGE_URL="$(printf '%s\n' "$JSON" | grep -o '"browser_download_url": *"[^"]*\.AppImage"' | head -n1 | sed 's/.*"\(https[^"]*\)"$/\1/')"
SUMS_URL="$(printf '%s\n' "$JSON" | grep -o '"browser_download_url": *"[^"]*SHA256SUMS[^"]*"' | head -n1 | sed 's/.*"\(https[^"]*\)"$/\1/')"

[ -n "$TAG" ] && [ -n "$APPIMAGE_URL" ] || die "Bu sürümde AppImage dosyası bulunamadı ($TAG)."
[ -n "$SUMS_URL" ] || die "Bu sürümde SHA256SUMS dosyası yok; güvenlik nedeniyle kurulum durduruldu."

say "Sürüm: $TAG"

# ---------------------------------------------------------------- indir ve doğrula

say "AppImage indiriliyor..."
curl -fL --progress-bar -o "$TMP/Radyn.AppImage" "$APPIMAGE_URL"
curl -fsSL -o "$TMP/SHA256SUMS.txt" "$SUMS_URL"

EXPECTED="$(grep -i 'AppImage' "$TMP/SHA256SUMS.txt" | awk '{print $1}' | head -n1)"
[ -n "$EXPECTED" ] || die "SHA256SUMS dosyasında AppImage özeti yok."
ACTUAL="$(sha256sum "$TMP/Radyn.AppImage" | awk '{print $1}')"
if [ "$EXPECTED" != "$ACTUAL" ]; then
  die "SHA-256 doğrulaması BAŞARISIZ (beklenen $EXPECTED, bulunan $ACTUAL). Dosya bozulmuş olabilir; kurulum iptal edildi."
fi
say "SHA-256 doğrulandı."

# ---------------------------------------------------------------- kur

mkdir -p "$APP_DIR" "$BIN_DIR" "$APPS_DIR" "$ICON_DIR"
mv -f "$TMP/Radyn.AppImage" "$APPIMAGE"
chmod +x "$APPIMAGE"

say "Simge indiriliyor..."
if ! curl -fsSL -o "$ICON_FILE" "${RAW}/${TAG}/assets/icon.png"; then
  warn "Simge indirilemedi; uygulama yine de çalışır (menüde varsayılan simge görünür)."
fi

# FUSE yoksa AppImage bağlanamaz; o durumda kendi kendine açılmaya geç.
EXEC_PREFIX=""
if ! ldconfig -p 2>/dev/null | grep -q 'libfuse\.so\.2'; then
  warn "libfuse2 bulunamadı. AppImage için önerilen kurulum:"
  warn "  Debian/Ubuntu: sudo apt install libfuse2   |   Fedora: sudo dnf install fuse-libs"
  warn "Şimdilik uygulama, FUSE gerektirmeden açılacak şekilde ayarlandı."
  EXEC_PREFIX="env APPIMAGE_EXTRACT_AND_RUN=1 "
fi

SANDBOX_FLAG=""
if userns_restricted; then
  SANDBOX_FLAG=" --no-sandbox"
  warn "Bu sistemde kullanıcı ad alanları kısıtlı; Chromium sandbox'ı açılamaz."
  warn "Radyn --no-sandbox ile açılacak (sistem güvenliğini biraz düşürür)."
  warn "Sandbox'ı açmak için sistem yöneticinizle AppArmor profili tanımlayabilirsiniz (README: Linux)."
fi

rm -f "$DESKTOP_FILE"
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Radyn
GenericName=Canlı radyo
Comment=Dünyanın dört bir yanından canlı radyo istasyonları
Exec=${EXEC_PREFIX}"${APPIMAGE}"${SANDBOX_FLAG} %U
Icon=${ICON_FILE}
Terminal=false
Categories=AudioVideo;Audio;Player;
Keywords=radyo;radio;music;
StartupWMClass=Radyn
EOF
chmod 644 "$DESKTOP_FILE"

# Mevcut bağlantı/dosya kaldırılır: üstüne yazmak (symlink üzerinden) AppImage'ı bozabilir.
rm -f "$BIN_DIR/radyn"
if [ -n "$SANDBOX_FLAG" ]; then
  cat > "$BIN_DIR/radyn" <<EOF
#!/bin/sh
exec "$APPIMAGE"$SANDBOX_FLAG "\$@"
EOF
  chmod +x "$BIN_DIR/radyn"
else
  ln -s "$APPIMAGE" "$BIN_DIR/radyn"
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------- özet

say "Radyn $TAG kuruldu."
echo "    Uygulama      : $APPIMAGE"
echo "    Menü kısayolu : $DESKTOP_FILE"
echo "    Komut         : radyn   (PATH içinde $BIN_DIR olmalı)"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) warn "$BIN_DIR PATH içinde değil; komut satırından 'radyn' için ~/.profile dosyasına ekleyin: export PATH=\"\$HOME/.local/bin:\$PATH\"" ;;
esac
echo
echo "Açmak için uygulama menüsünde 'Radyn'i seçin veya: radyn"
echo "Kaldırmak için: bash install-radyn.sh --uninstall"
echo "'No usable sandbox' hatası alırsanız README'deki 'Linux' bölümüne bakın."
