# Radyn 1.1.0

Dünyanın dört bir yanından canlı radyo. Ülke ülke kategoriler, arama, favoriler, şu an çalan şarkı bilgisi ve albüm kapağı, Windows görev çubuğu ve Linux masaüstü entegrasyonu.

## İndirme

| Dosya | Platform |
|---|---|
| `Radyn-Setup-1.1.0.exe` | Windows 10/11 (x64) kurulum dosyası |
| `Radyn-1.1.0.AppImage` | Linux (x64), taşınabilir |
| `radyn_1.1.0_amd64.deb` | Linux (x64), Debian/Ubuntu |
| `install-radyn.sh` | Linux tek komutla kurulum betiği (AppImage'ı indirir, doğrular, kurar) |
| `SHA256SUMS.txt` | Tüm dosyaların SHA-256 özetleri (betik dahil) |

Doğrulama:

```powershell
# Windows (PowerShell)
Get-FileHash ".\Radyn-Setup-1.1.0.exe" -Algorithm SHA256
```

```bash
# Linux
sha256sum -c SHA256SUMS.txt --ignore-missing
```

Linux'ta tek komutla kurmak için bu sürümdeki `install-radyn.sh` dosyasını indirip çalıştırın:

```bash
curl -fsSLO https://github.com/Kurenai10/radyn/releases/download/v1.1.0/install-radyn.sh
bash install-radyn.sh
```

Betik en son sürümün AppImage dosyasını indirir, `SHA256SUMS.txt` ile doğrular ve uygulama menüsüne ekler. Belirli bir sürüm için `--version v1.1.0`, kaldırmak için `--uninstall` kullanabilirsiniz. Ayrıntılar README'dedir.

> **Not:** Windows kurulum dosyası şu an sertifikayla imzalı değildir. "Windows PC'nizi korudu" uyarısı görürseniz **Ek bilgi → Yine de çalıştır** seçeneğini kullanın. Sertifika tanımlandığında sonraki sürümler imzalanacaktır.

## Yenilikler (1.1.0)

- **Beş dil:** Türkçe, English, Deutsch, Français, Español. Sistem diline göre başlar; kenar çubuğundan değiştirilebilir. Görev çubuğu, jump list ve tepsi menüsü de seçilen dili kullanır.
- **Windows jump list:** Görev çubuğundaki simgeye sağ tıklayınca **Oynat / Durdur**, **Önceki istasyon** ve **Sonraki istasyon** görevleri.
- **Tek bağlantılı yayın:** Yayın artık yerel bir aktarıcıdan geçer. Bant genişliği iki katına çıkmaz ve şarkı bilgisi aynı akıştan okunur.
- **HLS şarkı bilgisi:** HLS yayınları ID3 etiketi taşıyorsa şarkı adı ve sanatçı gösterilir.
- **Linux kurulum betiği:** `install-radyn.sh` en son sürümü indirir, SHA-256 ile doğrular, uygulama menüsüne ekler; `--version` ve `--uninstall` seçenekleri vardır.
- **Otomatik yayın hattı:** Sürüm etiketi gönderildiğinde Windows ve Linux paketleri derlenir, Linux'ta duman testi yapılır, özetler üretilip yayınlanır.
- Ses seviyesi ve dil tercihi kalıcıdır.

## Düzeltmeler

- Yayın için iki bağlantı açılması (bant genişliğinin iki katına çıkması) giderildi.
- Ülke adları artık seçili dilde gösteriliyor (önceden yalnızca Türkçe).

## Bilinen sınırlamalar

- Şarkı bilgisi yalnızca yayın metadata gönderiyorsa görünür. HLS yayınlarında yalnızca ID3 etiketi varsa görünür.
- Albüm kapağı iTunes kataloğuna bağlıdır; eşleşme yoksa istasyon logosu gösterilir.
- Tepsi simgesi GNOME'da **AppIndicator and KStatusNotifierItem Support** eklentisi gerektirir.
- Windows kurulum dosyası imzasızdır; SmartScreen uyarısı çıkar.
- Görev çubuğu düğmeleri ve jump list Windows API'siyle eklenir ve sistem tarafından kabul edildiği doğrulanır; görsel doğrulama her ortamda yapılamayabilir.
- Katalog topluluk tarafından işletilir; bazı istasyonlar çevrimdışı olabilir.

Sorun bildirirken README'deki [Hata raporu nasıl hazırlanır](README.md#hata-raporu-nasıl-hazırlanır) bölümündeki bilgileri ekleyin.

## Sistem gereksinimleri

- **Windows:** 10 veya 11, 64-bit; kurulum sonrası yaklaşık 400 MB.
- **Linux:** 64-bit, Electron'u destekleyen güncel bir masaüstü dağıtımı; AppImage için `libfuse2` (önerilir).
- İnternet bağlantısı (yayınlar, katalog ve isteğe bağlı servisler için).
