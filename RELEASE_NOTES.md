# Radyn 1.0.0

Dünyanın dört bir yanından canlı radyo. Ülke ülke kategoriler, arama, favoriler, şu an çalan şarkı bilgisi ve albüm kapağı, Windows görev çubuğu entegrasyonu.

## İndirme

| Dosya | Açıklama | SHA-256 |
|---|---|---|
| `Radyn Setup 1.0.0.exe` | Windows 10/11 (x64) kurulum dosyası | `6ff9071676e4ed82c81da1ec4aa3fbdc6dd9f59cdb3913a958ecdd1e66c857ce` |

Doğrulama (PowerShell):

```powershell
Get-FileHash ".\Radyn Setup 1.0.0.exe" -Algorithm SHA256
```

> **Not:** Kurulum dosyası dijital olarak imzalanmamıştır. Windows "Windows PC'nizi korudu" uyarısı gösterirse **Ek bilgi → Yine de çalıştır** seçeneğini kullanın.

Linux kullanıcıları için bu sürümde ikili dosya yayımlanmamıştır; kaynak koddan çalıştırma ve paketleme adımları README'de anlatılmıştır.

## Öne çıkanlar

- **Açılışta bulunduğunuz ülkenin istasyonları** (IP tabanlı konum; servis yanıt vermezse işletim sistemi bölge ayarı; ülkede istasyon yoksa Popüler).
- **224 ülke** (Türkçe adlarla) ve **türler** ile gezinme; dünya genelinde **arama**.
- **50.000'den fazla istasyon** (Radio Browser), yalnızca çalışan kayıtlar listelenir.
- **Şu an çalan:** yayının gönderdiği şarkı adı ve sanatçı (ICY), bulunursa **albüm kapağı**.
- **Favoriler** ve **son dinlenenler** (kalıcı).
- **Sessize alma** (ses simgesi veya `M`), ses seviyesi kaydedilir.
- **Canlı yayın dayanıklılığı:** bağlantı koparsa 3 kez yeniden bağlanır.
- **Windows görev çubuğu:** pencere küçük resminde Önceki / Oynat-Durdur / Sonraki düğmeleri.
- **Tepsi simgesi**, klavyedeki **medya tuşları** ve Linux için **MPRIS** desteği.
- **Tema:** Windows'un açık/koyu modu ve vurgu rengi.

## Değişiklikler (ilk sürüm)

- Electron 45 tabanlı masaüstü uygulaması, Node.js 20+ ile geliştirildi.
- Radio Browser kataloğu için üç sunucu yedeklemesi ve istemci tarafı hata yönetimi.
- ICY metadatası okuyucusu; yeniden bağlanma ve geri çekilme (backoff) desteği.
- iTunes Search ile albüm kapağı; sanatçı/parça eşleşmesi ve önbellek.
- IP tabanlı ülke tespiti (ipapi.co, ipwho.is; yedek: işletim sistemi bölgesi).
- Favoriler, son dinlenenler ve ses ayarı için atomik JSON kalıcılığı.
- Kapatınca tepsiye küçülme; ikinci kopyayı engelleme (mevcut pencere öne gelir).
- Güvenlik: `contextIsolation` ve `sandbox` açık, sınırlı `preload` köprüsü, gezinme ve yeni pencere engelleme, CSP.
- Linux: masaüstü giriş dosyası, kullanıcı kurulum betiği, `dist:linux` yapılandırması.
- 28 birim/entegrasyon testi (radyo API, ICY uçtan uca, kapak eşleşmesi, depo, konum).

## Bilinen sorunlar

- Şarkı bilgisi yalnızca ICY metadatası gönderen yayınlarda görünür; HLS (`m3u8`) yayınlarında görünmez.
- Her çalan istasyon için metadata okumak amacıyla ikinci bir bağlantı açılır; yayın veri trafiği kabaca iki katına çıkabilir.
- Albüm kapağı iTunes kataloğuna bağlıdır; eşleşme yoksa istasyon logosu gösterilir.
- Görev çubuğu düğmeleri yalnızca Windows'ta; tepsi simgesi GNOME'da bir eklenti gerektirir.
- Linux paketi bu sürümde çalıştırılarak doğrulanmadı.
- Kurulum dosyası imzasız; SmartScreen uyarısı çıkar.
- Arayüz yalnızca Türkçedir.

Sorun bildirirken README'deki [Hata raporu nasıl hazırlanır](README.md#hata-raporu-nasıl-hazırlanır) bölümündeki bilgileri ekleyin.

## Sistem gereksinimleri

- Windows 10 veya 11, 64-bit; kurulum sonrası yaklaşık 400 MB.
- İnternet bağlantısı (yayınlar, katalog ve isteğe bağlı servisler için).
