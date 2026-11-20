# Radyn

Dünyanın dört bir yanından canlı radyo. Ülke ülke kategoriler, tür filtreleri, arama, favoriler, şu an çalan şarkı bilgisi ve albüm kapağı, Windows görev çubuğu ve Linux masaüstü entegrasyonu.

- **Sürüm:** 1.1.0
- **Platform:** Windows 10/11 (x64) · Linux (x64)
- **Diller:** Türkçe, English, Deutsch, Français, Español
- **Teknoloji:** Electron 45, düz HTML/CSS/JavaScript arayüzü, Node.js 20+

> Sürüm notları ve indirmeler: [Sürümler sayfası](https://github.com/Kurenai10/radyn/releases) · [RELEASE_NOTES.md](RELEASE_NOTES.md)

---

## İçindekiler

1. [Özellikler](#özellikler)
2. [Ekran düzeni](#ekran-düzeni)
3. [Kurulum — Windows](#kurulum--windows)
4. [Kurulum — Linux](#kurulum--linux)
5. [Kaynak koddan çalıştırma](#kaynak-koddan-çalıştırma)
6. [Kullanım kılavuzu](#kullanım-kılavuzu)
7. [Klavye kısayolları](#klavye-kısayolları)
8. [Dil seçimi](#dil-seçimi)
9. [Verileriniz ve dosya konumları](#verileriniz-ve-dosya-konumları)
10. [Gizlilik ve ağ trafiği](#gizlilik-ve-ağ-trafiği)
11. [Hata giderme](#hata-giderme)
12. [Hata raporu nasıl hazırlanır](#hata-raporu-nasıl-hazırlanır)
13. [Geliştirici rehberi](#geliştirici-rehberi)
14. [Bilinen sınırlamalar](#bilinen-sınırlamalar)

---

## Özellikler

| Alan | Ne yapar |
|---|---|
| **İstasyon kataloğu** | [Radio Browser](https://www.radio-browser.info/) açık veritabanından 50.000'den fazla istasyon. Yalnızca çalışan kayıtlar listelenir. |
| **Bulunduğum ülke** | Açılışta IP adresinize göre ülkenizi bulur ve o ülkenin istasyonlarını gösterir. |
| **Ülkeler ve türler** | 224 ülke (seçili dilde adlarıyla) ve en popüler 80 tür. |
| **Arama** | Dünya genelinde istasyon adına göre arama. |
| **Favoriler, son dinlenenler** | Kalıcıdır; uygulama kapanınca kaybolmaz. |
| **Şu an çalan** | Logo, yayının verdiği **şarkı adı ve sanatçı** (ICY veya HLS ID3 metadatası), bulunursa **albüm kapağı**. |
| **Tek bağlantı** | Yayın yalnızca bir kez indirilir; şarkı bilgisi aynı akıştan okunur (bant genişliği çift değildir). |
| **Ses** | Kaydırıcı, **sessize alma** (ses simgesi veya `M`). Ses seviyesi kaydedilir. |
| **Dayanıklılık** | Bağlantı koparsa üç kez, artan aralıklarla yeniden bağlanır. |
| **Windows görev çubuğu** | Küçük resim düğmeleri (Önceki / Oynat-Durdur / Sonraki), jump list kısayolları, çalan istasyon adı ipucunda. |
| **Tepsi** | Göster/gizle, oynat/durdur, önceki/sonraki, çıkış. |
| **Medya tuşları** | Klavyedeki Oynat/Duraklat, Sonraki, Önceki, Durdur tuşları. |
| **Linux masaüstü** | MPRIS ile medya panelinde ve kilit ekranında kontrol. Tek komutla kurulum betiği. |
| **Diller** | Türkçe, English, Deutsch, Français, Español. Sistem diline göre başlar, değiştirilebilir. |
| **Tema** | Windows'un açık/koyu modunu ve vurgu rengini kullanır. |

---

## Ekran düzeni

```
┌───────────────┬──────────────────────────────────────────────────────┐
│ ◉ Radyn       │ Konumunuz: Türkiye                  [ 🔍 Arama ]     │
│               │ 500 istasyon                                         │
│ ● Bulunduğum  │                                                      │
│   ülke        │  ┌────────┐ ┌────────┐ ┌────────┐                    │
│ ○ Popüler     │  │ logo   │ │ logo   │ │ logo   │                    │
│ ○ Favoriler 3 │  │ Ad     │ │ Ad     │ │ Ad     │                    │
│ ○ Son dinl.   │  │ ülke…  │ │ ülke…  │ │ ülke…  │                    │
│               │  └────────┘ └────────┘ └────────┘                    │
│ KEŞFET        │                                                      │
│ [Ülkeler|Tür] │                                                      │
│ ülke listesi  │                                                      │
│ Dil: Türkçe ▾ │                                                      │
├───────────────┴──────────────────────────────────────────────────────┤
│ [kapak] Şarkı adı          ☆  ⏮  ⏯  ⏭        CANLI · 02:15   🔈 ━━━│
│         Sanatçı · İstasyon                                           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Sol kenar çubuğu:** ana kategoriler, ülke/tür gezgini ve dil seçici.
- **Orta alan:** seçilen kategorinin istasyon kartları. Çalan istasyonun kartında hareketli eşitleyici görünür.
- **Alt oynatıcı çubuğu:** kapak, şarkı/istasyon bilgisi, favori, oynat/durdur, önceki/sonraki, durum (`CANLI · süre`, `Bağlanıyor…`, `Tamponlanıyor…`, `Bağlantı kurulamadı`), sessize alma ve ses.

---

## Kurulum — Windows

### Gereksinimler

- Windows 10 veya Windows 11, 64-bit
- Yaklaşık 400 MB boş alan
- İnternet bağlantısı

### Adımlar

1. [Sürümler sayfasından](https://github.com/Kurenai10/radyn/releases/latest) **`Radyn-Setup-1.1.0.exe`** dosyasını indirin.
2. Dosyaya çift tıklayın. Windows **"Windows PC'nizi korudu"** uyarısı gösterirse **Ek bilgi → Yine de çalıştır** seçin.

   > Bu uyarı, kurulum dosyasının güvenilir bir sertifika ile imzalanmamış olmasından kaynaklanır. Kod imzalama yapılandırıldığında (bkz. [Kod imzalama](#kod-imzalama-smartscreen)) uyarı kalkar. Dosyanın bütünlüğünü [SHA-256 özetiyle](#sha-256-doğrulaması) doğrulayabilirsiniz.
3. Kurulum kullanıcı klasörüne yapılır, yönetici izni gerekmez: `%LOCALAPPDATA%\Programs\Radyn`.
4. Radyn'i Başlat menüsünden veya masaüstü kısayolundan açın.

### Kaldırma

**Ayarlar → Uygulamalar → Radyn → Kaldır**. Favoriler ve ayarlar (`%APPDATA%\Radyn`) otomatik silinmeyebilir; tamamen temizlemek için bu klasörü de silin.

### SHA-256 doğrulaması

Her sürümde `SHA256SUMS.txt` dosyası yayınlanır. PowerShell'de:

```powershell
Get-FileHash ".\Radyn-Setup-1.1.0.exe" -Algorithm SHA256
```

Çıktı, `SHA256SUMS.txt` içindeki Windows satırıyla aynı olmalıdır.

---

## Kurulum — Linux

Linux'ta üç yol vardır: **tek komutla kurulum** (önerilen), **AppImage/.deb'i elle kurmak** ve **kaynak koddan çalıştırma**.

### Yol A — Tek komutla kurulum (önerilen)

Depodaki `install-radyn.sh` betiği en son sürümün AppImage dosyasını indirir, SHA-256 özetini doğrular ve kurar:

```bash
# Betiği indirin
curl -fsSLO https://raw.githubusercontent.com/Kurenai10/radyn/main/install-radyn.sh

# Kurun (kök yetkisi gerekmez)
bash install-radyn.sh
```

Ya da [sürüm sayfasındaki](https://github.com/Kurenai10/radyn/releases/tag/v1.1.0) `install-radyn.sh` dosyasını indirip aynı şekilde çalıştırabilirsiniz.

Betik şunları yapar:

- En son sürümü bulur ve `Radyn-1.1.0.AppImage` dosyasını indirir.
- `SHA256SUMS.txt` ile özeti doğrular; eşleşmezse kurulumu durdurur.
- `~/.local/share/radyn/Radyn.AppImage` olarak kurar ve `~/.local/bin/radyn` komutunu oluşturur.
- Uygulama menüsüne **Radyn** kısayolu ekler (`~/.local/share/applications/radyn.desktop`).

Belirli bir sürümü kurmak için: `bash install-radyn.sh --version v1.1.0`
Kaldırmak için: `bash install-radyn.sh --uninstall` (favoriler ve ayarlar `~/.config/Radyn` içinde korunur)

AppImage için gereken `libfuse2` yoksa betik bunu bildirir ve uygulamayı FUSE gerektirmeden açılacak şekilde ayarlar.

### Yol B — AppImage veya .deb'i elle kurmak

Sürümler sayfasından dosyayı indirin ve `SHA256SUMS.txt` ile doğrulayın:

```bash
sha256sum -c SHA256SUMS.txt --ignore-missing

# AppImage
chmod +x Radyn-1.1.0.AppImage
./Radyn-1.1.0.AppImage

# .deb (Debian/Ubuntu)
sudo apt install ./radyn_1.1.0_amd64.deb
```

### Yol C — Kaynak koddan çalıştırma

```bash
# Node.js 20+ gerekir
cd /ruta/proje-klasoru
npm install
npm start
```

### Linux'a özgü notlar

- **Medya kontrolü:** MPRIS üzerinden GNOME/KDE medya panelinde ve kilit ekranında çalışır.
- **Tepsi:** GNOME'da simge görünmesi için **AppIndicator and KStatusNotifierItem Support** eklentisi gerekir. Eklenti yoksa da uygulama açılır; ikinci kopya açmak pencereyi öne getirir.
- **Sandbox:** Kurulum betiği, kullanıcı ad alanları kısıtlıysa (Ubuntu 24.04+ gibi) Chromium sandbox'ının açılamadığını algılar; yalnızca bu durumda uygulamayı `--no-sandbox` ile açar ve bunu uyarıyla bildirir. Kısıt yoksa sandbox açık kalır.

---

## Kaynak koddan çalıştırma

```powershell
cd C:\Users\Admin\Documents\radio
npm install
npm start          # uygulamayı açar; hatalar bu terminale yazılır
npm test           # 37 birim ve entegrasyon testi
npm run icons      # ikonları assets/ klasörüne yeniden üretir
```

`npm install` sırasında Electron ikilisi indirilir. Ağınız GitHub'a erişmiyorsa:

```powershell
$env:ELECTRON_MIRROR = "https://kurumsal-ayna-adresiniz/electron/"   # kendi ayna adresinizi yazın
npm install
```

Ya da `node_modules\electron` klasörünü silip `npm install` komutunu yeniden çalıştırın.

---

## Kullanım kılavuzu

### 1. İlk açılış

Uygulama **"Bulunduğum ülke"** görünümüyle açılır: IP adresinizden ülkenizi bulur ve o ülkenin istasyonlarını listeler. Ülke bulunamazsa veya o ülkede istasyon yoksa **Popüler** listesi açılır.

### 2. Ülke ve tür ile gezinme

- **Ülkeler** sekmesinden bir ülkeye tıklayın; liste o ülkenin en çok oy alan istasyonlarıdır.
- **Türler** sekmesinde `jazz`, `news`, `pop` gibi bir türe tıklayın.
- Liste üstündeki filtre kutusu ülke/tür adını süzer.

### 3. Arama

Üst sağdaki kutuya istasyon adını yazıp Enter'a basın (ya da `Ctrl+F` ile kutuya gidin). Sonuçlar dünya genelindendir.

### 4. Bir istasyonu çalmak

- Karta tıklayın veya kart odaktayken Enter'a basın.
- **⏯** düğmesi çalan istasyonu durdurur; durmuş istasyonda yeniden başlatır.
- **⏮ / ⏭** düğmeleri, istasyonun bulunduğu liste içinde önceki/sonraki istasyona geçer.

| Durum | Anlamı |
|---|---|
| `Bağlanıyor…` | Yayına bağlanılıyor |
| `Tamponlanıyor…` | Veri bekleniyor (ağ yavaş olabilir) |
| `CANLI · 02:15` | Yayın çalıyor; süre bu oturumdan beri |
| `Bağlantı kurulamadı` | Üç yeniden deneme de başarısız oldu — [hata giderme](#istasyon-bağlantı-kurulamadı-diyor) |
| `Durduruldu` | Yayın durduruldu |

### 5. Şu an çalan parça

Yayın şarkı bilgisi gönderiyorsa alt çubukta **şarkı adı** ve **sanatçı** görünür (ICY metadatası; HLS yayınlarda ID3 etiketi). Uygulama bu bilgiyle iTunes kataloğunda eşleşen bir **albüm kapağı** arar; bulunursa gösterilir, bulunamazsa istasyon logosu gösterilir.

### 6. Favoriler ve son dinlenenler

- Kartın sağ üstündeki **☆** ile favoriye ekleyin, **★** ile çıkarın. Alt çubuktaki ★ çalan istasyon için çalışır.
- **Favoriler** ve **Son dinlenenler** kalıcıdır (son 30 istasyon).

### 7. Ses ve sessize alma

- Alt çubuktaki kaydırıcı ses seviyesini ayarlar.
- Ses simgesine tıklayın veya **`M`** tuşuna basın: ses kapanır; tekrar basınca kaydırıcının kaldığı seviyeden açılır.
- Kaydırıcıyı oynatmak da sesi açar.

### 8. Pencere, tepsi ve çıkış

- Pencerenin **X** düğmesi uygulamayı **kapatmaz**; tepsiye küçülür ve yayın kesilmez.
- Tepsi simgesine tek tıklama pencereyi açar/gizler.
- Tamamen çıkmak için tepsi simgesine sağ tıklayın → **Çıkış**.
- Uygulama ikinci kez açılırsa mevcut pencere öne gelir.

### 9. Windows görev çubuğu

- **Küçük resim düğmeleri:** Görev çubuğundaki Radyn simgesinin üzerine gelin; önizlemenin altında **Önceki**, **Oynat/Durdur** ve **Sonraki** düğmeleri görünür. Oynat/Durdur simgesi çalan duruma göre değişir ve görev çubuğu ipucunda çalan istasyon adı yazar.
- **Jump list (sağ tık menüsü):** Görev çubuğundaki Radyn simgesine sağ tıklayın; **Oynat / Durdur**, **Önceki istasyon** ve **Sonraki istasyon** görevleri bulunur. Uygulama kapalıysa bu görev uygulamayı açar ve komutu çalıştırır.

### 10. Medya tuşları

Klavyenizdeki **Oynat/Duraklat**, **Sonraki**, **Önceki** ve **Durdur** tuşları, uygulama açıkken pencere gizli olsa bile yayını kontrol eder.

---

## Klavye kısayolları

| Tuş | İşlev |
|---|---|
| `Boşluk` | Oynat / Durdur |
| `←` / `→` | Önceki / sonraki istasyon (çalan listede) |
| `M` | Sessize al / sesi aç |
| `Ctrl+F` | Arama kutusuna odaklan |
| `Enter` | Odaktaki istasyon kartını çal (★ düğmesinde ise favoriyi değiştirir) |
| Medya tuşları | Oynat/Durdur, önceki, sonraki, durdur (genel kısayol) |

---

## Dil seçimi

- Uygulama işletim sisteminizin dilinden başlar: Türkçe, Deutsch, Français, Español veya English. Desteklenmeyen dillerde English kullanılır.
- Kenar çubuğunun altındaki **Dil / Language** seçiciden değiştirebilirsiniz; seçim anında uygulanır ve kaydedilir.
- Görev çubuğu düğmeleri, jump list ve tepsi menüsü de seçilen dili kullanır.
- Ülke adları seçili dile göre yeniden çevrilir. İstasyon adları ve türler kataloğun orijinal metnidir.

---

## Verileriniz ve dosya konumları

Radyn hesap istemez; her şey yerel olarak saklanır. Kalıcı veriler tek bir JSON dosyasındadır:

| İşletim sistemi | Konum |
|---|---|
| Windows | `%APPDATA%\Radyn\veri.json` |
| Linux | `~/.config/Radyn/veri.json` |

```json
{
  "favorites": [ { "uuid": "...", "name": "...", "url": "...", "favicon": "...", "country": "...", "countryCode": "TR", "tags": [], "codec": "MP3", "bitrate": 128 } ],
  "recent": [ ],
  "settings": { "volume": 0.8, "lang": "tr" }
}
```

- **Yedeklemek:** `veri.json` dosyasını kopyalayın.
- **Sıfırlamak:** Radyn'i kapatın, `veri.json` dosyasını silin, uygulamayı yeniden açın.
- **Bozuk dosya:** JSON okunamazsa Radyn varsayılan verilerle açılır; bir sonraki kayıtta dosya yeniden yazılır. Silmeden önce yedeğini alın.

---

## Gizlilik ve ağ trafiği

| Servis | Ne zaman | Gönderilen |
|---|---|---|
| `de1/nl1/at1.api.radio-browser.info` | Katalog, ülke/tür listeleri, arama, tıklama sayacı | İstek parametreleri (ülke kodu, arama metni) ve istasyon kimliği (sayaç için) |
| `ipapi.co`, `ipwho.is` | Açılışta, oturum başına bir kez | **IP adresiniz** (servis tarafından görülür); yanıt olarak yalnızca ülke kodu alınır |
| `itunes.apple.com` | Yeni bir şarkı bilgisi geldiğinde | Sanatçı ve şarkı adı (kapak aramak için) |
| Yayın sunucusu (istasyonun kendi adresi) | Çalınan istasyon | Standart HTTP veya HLS istekleri |

- Yayın, uygulamanın kendi makinesindeki `127.0.0.1` üzerindeki aktarıcıdan geçer; bu trafik dışarıya çıkmaz.
- Radyn hesap, izleme veya telemetri içermez.
- Konum sorgusu açılışta yapılır. Şu an bunu kapatan bir ayar yoktur; kaynak koddan çalışıyorsanız `renderer/app.js` içindeki `init` fonksiyonunda `showView('home')` çağrısını `showView('top')` ile değiştirirseniz açılışta IP sorgusu yapılmaz.

---

## Hata giderme

Bir sorun için önce ilgili başlığa bakın. Çözülmezse [hata raporu](#hata-raporu-nasıl-hazırlanır) bölümündeki bilgileri toplayın.

### Kurulum ve başlatma

#### "Windows PC'nizi korudu" uyarısı çıkıyor
Kurulum dosyası sertifikayla imzalanmamış. **Ek bilgi → Yine de çalıştır** ile devam edebilirsiniz. Dosyanın bütünlüğünü [SHA-256 özetiyle](#sha-256-doğrulaması) doğrulayın.

#### `npm install` Electron indirirken takılıyor ya da hata veriyor
`ETIMEDOUT`, `ECONNRESET` veya `Electron failed to install correctly` görüyorsanız: ağ bağlantınızı ve proxy ayarlarını kontrol edin, `ELECTRON_MIRROR` ile bir ayna kullanın ya da `node_modules` klasörünü silip yeniden kurun.

#### `npm start` "electron.exe bulunamadı" diyor
```powershell
Remove-Item -Recurse -Force node_modules\electron
npm install
```

#### Linux: `error while loading shared libraries: libXXX.so.N`
Bir sistem kütüphanesi eksik. Debian/Ubuntu için sık görülen paketler:

```bash
sudo apt install libnss3 libatk-bridge2.0-0 libgtk-3-0 libasound2 libxss1 libgbm1 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2
```

Hata mesajındaki `libXXX.so` adını arayıp (`apt search libxxx`) paketi bulabilirsiniz.

#### Linux: `No usable sandbox!` veya uygulama açılmadan kapanıyor
Ubuntu 23.10/24.04 gibi dağıtımlar kullanıcı ad alanlarını AppArmor ile kısıtlayabilir. `install-radyn.sh` bunu algılar ve uygulamayı `--no-sandbox` ile açar (uyarı verir). Daha güvenli çözüm, sistem yöneticinizle birlikte Electron için bir AppArmor profili tanımlamaktır; bu durumda betiği yeniden çalıştırmak sandbox'ı açık bırakır. `--no-sandbox` kullanımı, uygulamanın kendi arayüzünü çalıştırmasıyla sınırlı olsa da güvenliği düşürür.

#### Linux: `Permission denied`
```bash
chmod +x ~/.local/share/radyn/Radyn.AppImage
```
(Tek komutla kurulum betiğini kullandıysanız betik izinleri zaten ayarlar.)

#### Linux: AppImage açılmıyor, `fuse` hatası veriyor
`libfuse2` eksik: `sudo apt install libfuse2` (Debian/Ubuntu) veya `sudo dnf install fuse-libs` (Fedora). Geçici olarak şöyle açabilirsiniz: `APPIMAGE_EXTRACT_AND_RUN=1 ./Radyn-1.1.0.AppImage`

#### Linux: `SHA-256 doğrulaması BAŞARISIZ`
Dosya indirme sırasında bozulmuş ya da değiştirilmiş olabilir. Betik kurulumu durdurdu; tekrar deneyin. Sorun sürerse sürüm sayfasından dosyayı elle indirip `SHA256SUMS.txt` ile karşılaştırın ve bir hata raporu açın.

#### Uygulama açılıyor ama hemen kapanıyor
Terminalden başlatın (Windows: PowerShell'de `"%LOCALAPPDATA%\Programs\Radyn\Radyn.exe"`; Linux: `radyn`). Terminaldeki hata satırı çoğu zaman nedeni gösterir.

#### Uygulama zaten açık ama pencere görünmüyor
Uygulama tepsidedir. Tepsi simgesine tıklayın veya yeniden başlatmayı deneyin: ikinci kopya açılmaz, mevcut pencereyi öne getirir.

### Katalog ve listeler

#### "Radyo veritabanına ulaşılamadı (...)"
Radio Browser'a bağlanılamadı. Sırasıyla kontrol edin: internet bağlantısı; güvenlik duvarı, antivirüs veya kurumsal proxy `*.api.radio-browser.info` adreslerini engelliyor mu; birkaç dakika sonra tekrar deneyin. Uygulama üç sunucuyu sırayla dener.

#### Liste boş ya da "Liste alınamadı: ..." mesajı
Yukarıdakiyle aynı. Mesajdaki `HTTP 503` gibi bir kod, sunucunun geçici olarak yanıt vermediğini gösterir.

#### "Bulunduğum ülke" yerine Popüler açıldı
Bu bir hata değil, geri dönüş davranışıdır: konum servisine ulaşılamadıysa işletim sistemi bölge ayarı kullanılır; o da yoksa veya ülkede istasyon yoksa Popüler açılır.

#### Konum yanlış ülkeyi gösteriyor
IP tabanlı konum kesin değildir (VPN, mobil operatör, kurumsal çıkış noktası). **Ülkeler** sekmesinden doğru ülkeyi seçin.

#### Arama sonuç vermiyor
Daha kısa veya farklı bir ad deneyin. Arama istasyon **adına** göre yapılır; tür ya da ülke için ilgili sekmeleri kullanın. Çalışmayan istasyonlar sonuçlarda gösterilmez; bu beklenen davranıştır.

#### Bir istasyon çalmıyor
Katalogdaki kayıtların bir kısmı zamanla çevrimdışı olur. Başka bir istasyon deneyin.

### Oynatma ve ses

#### Ses hiç çıkmıyor
1. **Sessize alma:** Ses simgesi kapalı görünümdeyse `M` tuşuna basın.
2. **Windows Ses Karıştırıcısı:** Radyn'in sesi kısık veya kapalı olmasın.
3. **Çıkış aygıtı:** Doğru hoparlör/kulaklık seçili mi?
4. **Yayın:** Başka bir istasyon deneyin.
5. **Linux:** PipeWire/PulseAudio'nun çalıştığını doğrulayın.

#### İstasyon "Bağlantı kurulamadı" diyor
Üç yeniden deneme de başarısız oldu. Nedenler: yayın kapalı veya çevrimdışı; güvenlik duvarı yayın portunu engelliyor; yayın bölgesel kısıtlama uyguluyor (VPN'i kapatıp deneyin); yayın formatı desteklenmiyor.

#### Yayın sık kesiliyor, "Tamponlanıyor…" çok görünüyor
Kablolu bağlantı deneyin, ağır indirmeleri durdurun, düşük bitrate'li bir istasyon seçin.

#### Yayın gecikmeli
Canlı radyo yayınları genellikle birkaç saniye geriden gelir; bu normaldir. Duraklatma yoktur; durdurup yeniden başlatırsınız.

### Şarkı bilgisi ve albüm kapağı

#### Şarkı adı hiç görünmüyor
Şarkı bilgisi yayının metadata göndermesine bağlıdır: çoğu Shoutcast/Icecast MP3/AAC yayını gönderir; HLS yayınları ise yalnızca ID3 etiketi taşıyorsa gösterir. Yayın metadata göndermiyorsa Radyn okuyamaz.

#### Şarkı adı yanlış ya da reklam metni
Yayın kaynağı bunu gönderiyordur; Radyn değiştiremez.

#### Albüm kapağı görünmüyor
iTunes kataloğunda sanatçı ve parça adı eşleşmedi. Yanlış kapak göstermemek için yalnızca eşleşen sonuçlar kullanılır. Yayın şarkı adını `Sanatçı - Şarkı` biçiminde vermiyorsa eşleşme olmayabilir.

### Görev çubuğu ve tepsi

#### Küçük resim düğmeleri (Önceki/Oynat/Sonraki) görünmüyor
Düğmeler, görev çubuğundaki simgenin üzerine gelindiğinde açılan önizlemenin altındadır. Pencere tepsiye gizlenmişse görev çubuğunda simge yoktur; tepsiden **Pencereyi göster** deyin.

#### Jump list görevleri yok
Görev çubuğu simgesine sağ tıklayın. Görevler en az bir kez uygulama açıldığında kaydedilir. Dil değiştirdiyseniz görev adları bir sonraki açılışta güncellenir.

#### Tepsi simgesi görünmüyor (Linux)
GNOME'da **AppIndicator and KStatusNotifierItem Support** eklentisi gerekir. KDE ve XFCE'de genelde sorunsuz çalışır.

#### Medya tuşları çalışmıyor
Spotify, Groove, VLC gibi bir uygulama aynı tuşları önce aldıysa Radyn tepkisiz kalır. O uygulamayı kapatın. Bazı dizüstü bilgisayarlarda `Fn` tuşuyla birlikte basmanız gerekebilir.

#### Linux medya panelinde Radyn görünmüyor
MPRIS, `mpris-service` paketi kurulu ve DBus oturumu çalışıyorsa etkindir. Konsolda `MPRIS başlatılamadı` mesajı varsa DBus oturumunu kontrol edin.

### Pencere ve kapatma

#### Pencereyi kapattım ama uygulama açık kaldı
Bu tasarımdır: X düğmesi uygulamayı tepsiye küçültür, yayın kesilmez. Tamamen kapatmak için tepsi menüsünden **Çıkış** seçin.

#### Uygulama kapanmıyor
Tepsi menüsünden **Çıkış** deneyin. Çalışmazsa görev yöneticisinde `Radyn` süreçlerini sonlandırın. Favoriler ve ses ayarı her kapanışta kaydedildiği için kaybolmaz.

### Dil ve veriler

#### Dil yanlış ya da değişmiyor
Kenar çubuğunun altındaki dil seçicisini kullanın. Seçim `veri.json` içinde saklanır; sıfırlamak için `settings.lang` alanını silin.

#### Favorilerim kayboldu
`veri.json` dosyasının yerini kontrol edin ([Verileriniz](#verileriniz-ve-dosya-konumları)). Dosya bozulmuşsa uygulama boş verilerle açılır; silmeden önce yedek alın. Farklı bir bilgisayardan kopyaladıysanız dosyayı doğru klasöre koyduğunuzdan emin olun.

#### Veri kullanımı yüksek
Yayın, istasyonun bitrate'i kadar veri kullanır; ikinci bir bağlantı açılmaz. 320 kbps gibi yüksek bitrate'li yayınlar daha fazla veri harcar; mobil veride dikkatli olun.

---

## Hata raporu nasıl hazırlanır

Bir sorun çözülmediyse şu bilgileri toplayın:

1. **Sistem:** Windows sürümü (ör. 10 22H2, 11 23H2) veya Linux dağıtımı ve sürümü (`lsb_release -a`), CPU mimarisi.
2. **Radyn sürümü:** Ayarlar → Uygulamalar listesi ya da `package.json` içindeki `version`.
3. **Kaynak:** Kurulum dosyası, AppImage, .deb veya `npm start`.
4. **Adımlar:** Hatayı tetikleyen işlemler (ör. "Türkiye kategorisine tıkladım, bir istasyonu çalınca 'Bağlantı kurulamadı' çıktı").
5. **Ekran mesajı:** Durum satırındaki veya listedeki hata metni (tam olarak).
6. **Terminal çıktısı:** `npm start` ile başlatılmış oturumdan hata satırları (`Error`, `[taskbar]`, `MPRIS`, `Veriler kaydedilemedi` gibi).
7. **İstasyon (varsa):** Sorunlu istasyonun adı ve ülkesi. Yayın adresi isteğe bağlıdır.

Hata raporunda `veri.json` dosyanızın tamamını paylaşmayın; favoriler ve son dinlemeleriniz içinde olabilir.

---

## Geliştirici rehberi

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm install` | Bağımlılıkları ve Electron'u kurar |
| `npm start` | Uygulamayı geliştirme modunda açar |
| `npm test` | `node:test` ile 37 testi çalıştırır |
| `npm run icons` | Görev çubuğu düğmelerini ve tepsi ikonunu üretir |
| `npm run dist:win` | Windows kurulum dosyasını `dist/` içine üretir |
| `npm run dist:linux` | AppImage ve .deb üretir (Linux'ta çalıştırın) |
| `npx electron-builder --linux dir` | Linux paketli klasörünü üretir |

### Proje yapısı

```
radio/
├── main.js                 Ana süreç: pencere, tepsi, görev çubuğu, jump list, medya tuşları, IPC
├── preload.js              Arayüze açılan sınırlı köprü (window.radio)
├── install-radyn.sh        Linux kullanıcı kurulum betiği (sürümden indirir, doğrular)
├── src/
│   ├── radio-api.js        Radio Browser istemcisi (sunucu yedeklemeli)
│   ├── stream-proxy.js     Yerel ses aktarıcı: tek bağlantı, metadata ayırma, tek kullanımlık oturum
│   ├── icy.js              ICY metadata ayrıştırıcı (ses ve şarkı adını ayırır)
│   ├── id3.js              HLS için ID3 etiket okuyucu (renderer ve Node'da çalışır)
│   ├── strings.js          Beş dilin çeviri sözlüğü (renderer ve Node'da çalışır)
│   ├── art.js              Albüm kapağı arayıcı (iTunes Search, eşleşme kontrolü, önbellek)
│   ├── geo.js              IP tabanlı ülke tespiti (yedek: işletim sistemi bölgesi)
│   ├── store.js            Favoriler, son dinlenenler, ayarlar (JSON, atomik yazma)
│   └── mpris.js            Linux MPRIS entegrasyonu (isteğe bağlı)
├── renderer/
│   ├── index.html          Arayüz iskeleti (çeviri anahtarlı öğeler)
│   ├── app.js              Arayüz mantığı: gezinme, oynatma, favoriler, dil, sessize alma
│   ├── styles.css          Tema belirteçleri (açık/koyu), düzen
│   └── logo-mark.png       Kenar çubuğu logosu
├── assets/                 Uygulama ikonu, tepsi ikonu, görev çubuğu düğmeleri
├── packaging/radyn.desktop Linux masaüstü giriş dosyası şablonu
├── scripts/
│   ├── make-icons.js       Simge üretici (bağımlılıksız PNG kodlayıcı)
│   └── install-linux.sh    Yerel derlemeden kurulum (geliştiriciler için)
├── .github/workflows/
│   └── release.yml         Etiketle tetiklenen derleme, duman testi, imzalama ve yayın
└── test/                   node:test testleri
```

### Mimari özeti

- **Renderer** Node/Electron nesnelerine erişmez; yalnızca `preload.js` ile açılan `window.radio` köprüsünü kullanır. `contextIsolation` ve `sandbox` açıktır.
- **Yayın akışı:** Düz akışlar ana süreçteki yerel aktarıcıdan (`127.0.0.1`, tek kullanımlık adres) geçer. Aktarıcı yayını tek bağlantıda okur, ICY metadatasını ayırıp şarkı adını ana sürece verir, ses verisini değişmeden iletir. HLS yayınları hls.js ile çalar ve ID3 etiketini renderer'da okuyup iletir.
- **Durum senkronizasyonu:** Renderer oynatma durumunu ana sürece bildirir; ana süreç pencere başlığını, tepsi ipucunu, görev çubuğu düğmelerini, jump list'i ve MPRIS'i bu tek kaynaktan günceller.
- **Güvenlik:** Pencere dışına gezinme engellenir, yeni pencere açılmaz, bağlantılar tarayıcıda açılır. Arayüz verileri `textContent` ile yazılır. CSP meta etiketi aktiftir.

### Testler

| Dosya | Kapsam |
|---|---|
| `radio-api.test.js` | İstasyon normalizasyonu, sunucu yedeklemesi, ülke adları, geçersiz girdi |
| `icy.test.js` | ICY ayrıştırma, parça parça veri, yerel HTTP sunucusuyla uçtan uca şarkı bilgisi |
| `id3-proxy.test.js` | ID3 çerçeveleri (UTF-8, UTF-16, v2.4); yerel aktarıcı: metadata ayrımı, tek kullanımlık oturum, 502 hatası |
| `art-store.test.js` | Kapak eşleşmesi, önbellek, favori/son dinlenen/bozuk dosya |
| `geo.test.js` | Ülke kodu doğrulama, servis yedeklemesi, bölge ayarına düşme |
| `strings.test.js` | Beş dilde aynı anahtarlar, dil çözümleme, değişken doldurma |

### Sürüm yayını ve CI

`.github/workflows/release.yml` bir `v*` etiketi gönderildiğinde şunları yapar:

1. Birim testlerini çalıştırır.
2. **Linux:** `dir`, `AppImage` ve `deb` paketlerini derler; sanal ekranda (xvfb) uygulamayı 30 saniye çalıştırıp duman testi yapar; sandbox hatası veya erken kapanma varsa işi başarısız sayar.
3. **Windows:** NSIS kurulum dosyasını derler (imza anahtarları tanımlıysa imzalar).
4. Her platform için SHA-256 özetleri üretilir ve `SHA256SUMS.txt` olarak birleştirilir.
5. Sürüm oluşturulur veya güncellenir ve dosyalar yüklenir.

Yeni sürüm çıkarmak için:

```powershell
# package.json içindeki "version" alanını ve RELEASE_NOTES.md'yi güncelleyin, sonra:
git tag -a v1.2.0 -m "Radyn 1.2.0"
git push origin v1.2.0
```

### Kod imzalama (SmartScreen)

Windows'un "Windows PC'nizi korudu" uyarısı yalnızca **güvenilir bir sertifika ile imzalanmış** kurulum dosyalarında kalkar. İki yol vardır:

1. **Kod imzalama sertifikası (OV/EV):** Bir sertifika otoritesinden alınır (ücretlidir). Sertifika `.pfx` olarak dışa aktarılır ve GitHub deposuna iki gizli anahtar eklenir:
   - `WIN_CSC_LINK`: `.pfx` dosyasının base64 kodlu hali (`[Convert]::ToBase64String([IO.File]::ReadAllBytes("sertifika.pfx"))`)
   - `WIN_CSC_KEY_PASSWORD`: sertifika parolası

   Bu anahtarlar tanımlandığında sonraki sürüm otomatik olarak imzalanır.
2. **Azure Trusted Signing veya SignPath gibi bulut imzalama hizmetleri:** Ayrı yapılandırma gerektirir; `release.yml` içindeki Windows adımı buna göre genişletilebilir.

Sertifika olmadan imzalı sürüm üretilemez. Ayrıca SmartScreen itibarı birikir: imzalı olsa bile çok az indirilen yeni bir sürümde uyarı kısa süre görünebilir.

---

## Bilinen sınırlamalar

- **Şarkı bilgisi** yayının metadata göndermesine bağlıdır. HLS yayınları yalnızca ID3 etiketi taşıyorsa gösterilir.
- **Albüm kapağı** iTunes kataloğuna bağlıdır; her şarkı bulunamaz.
- **Katalog** topluluk tarafından işletilir; bazı istasyonlar çevrimdışı ya da hatalı meta bilgili olabilir.
- **Canlı yayın duraklatılamaz**; durdurulup yeniden başlatılır.
- **Tepsi simgesi** GNOME'da bir eklenti gerektirir.
- **Windows kurulum dosyası**, kod imzalama sertifikası tanımlanmadan imzalı olmaz; SmartScreen uyarısı çıkar.
- **Linux** sürümünün AppImage/deb paketi ve kurulum betiği, sürüm yayını sırasında CI'da derlenip duman testinden geçer; gerçek bir Linux masaüstünde ek doğrulama önerilir.
- **Görev çubuğu küçük resim düğmeleri ve jump list** Windows API'siyle eklenir ve sistem tarafından kabul edildiği doğrulanır; görsel doğrulama ortama bağlı olarak yapılamayabilir.

---

## Lisans

Bu proje henüz bir lisansla yayımlanmamıştır. Kullanım ve dağıtım koşulları için proje sahibine danışın.
