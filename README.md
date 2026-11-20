# Radyn

Dünyanın dört bir yanından canlı radyo. Ülke ülke kategoriler, tür filtreleri, arama, favoriler ve Windows/Linux görev çubuğu entegrasyonu tek bir hafif uygulamada.

- **Sürüm:** 1.0.0
- **Platform:** Windows 10/11 (x64) — test edildi. Linux (x64) — paketler üretildi, çalışma henüz doğrulanmadı.
- **Teknoloji:** Electron 45, düz HTML/CSS/JavaScript arayüzü, Node.js 20+

---

## İçindekiler

1. [Özellikler](#özellikler)
2. [Ekran düzeni](#ekran-düzeni)
3. [Kurulum — Windows](#kurulum--windows)
4. [Kurulum — Linux](#kurulum--linux)
5. [Kaynak koddan çalıştırma (geliştiriciler)](#kaynak-koddan-çalıştırma-geliştiriciler)
6. [Kullanım kılavuzu](#kullanım-kılavuzu)
7. [Klavye kısayolları](#klavye-kısayolları)
8. [Verileriniz ve dosya konumları](#verileriniz-ve-dosya-konumları)
9. [Gizlilik ve ağ trafiği](#gizlilik-ve-ağ-trafiği)
10. [Hata giderme (sorun çözme)](#hata-giderme-sorun-çözme)
11. [Hata raporu nasıl hazırlanır](#hata-raporu-nasıl-hazırlanır)
12. [Geliştirici rehberi](#geliştirici-rehberi)
13. [Bilinen sınırlamalar](#bilinen-sınırlamalar)
14. [Sürüm notları](#sürüm-notları)

---

## Özellikler

| Alan | Ne yapar |
|---|---|
| **İstasyon kataloğu** | [Radio Browser](https://www.radio-browser.info/) açık veritabanından 50.000'den fazla istasyon. Yalnızca çalışan kayıtlar (`hidebroken`) listelenir. |
| **Bulunduğum ülke** | Açılışta IP adresinize göre ülkenizi bulur ve o ülkenin istasyonlarını gösterir. |
| **Ülkeler** | 224 ülke, Türkçe adlarıyla ve istasyon sayısıyla. |
| **Türler** | pop, rock, jazz, haber, talk gibi en popüler 80 tür. |
| **Arama** | Dünya genelinde istasyon adına göre arama (en fazla 150 sonuç). |
| **Favoriler** | ★ ile ekleyin/çıkarın. Kalıcıdır, uygulama kapanınca kaybolmaz. |
| **Son dinlenenler** | Son 30 istasyon. |
| **Şu an çalan** | Logo, yayının verdiği **şarkı adı ve sanatçı** (ICY metadatası), bulunursa **albüm kapağı** (iTunes kataloğu). |
| **Ses** | Ses kaydırıcısı, **sessize alma** (ses simgesi veya `M`). Ses seviyesi kaydedilir. |
| **Canlı yayın dayanıklılığı** | Bağlantı koparsa 3 kez, artan aralıklarla yeniden bağlanır. |
| **Görev çubuğu (Windows)** | Pencere küçük resminde Önceki / Oynat-Durdur / Sonraki düğmeleri. |
| **Tepsi (Windows + Linux)** | Simge menüsü: göster/gizle, oynat/durdur, önceki/sonraki, çıkış. |
| **Medya tuşları** | Klavyedeki Oynat/Duraklat, Sonraki, Önceki, Durdur tuşları. |
| **Linux medya paneli** | MPRIS üzerinden GNOME/KDE medya kontrolü ve kilit ekranı bilgisi. |
| **Tema** | Windows'un açık/koyu modunu ve vurgu rengini otomatik kullanır. |

---

## Ekran düzeni

```
┌───────────────┬──────────────────────────────────────────────────────┐
│ Radyn         │ Konumunuz: Türkiye                  [ 🔍 Arama ]     │
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
├───────────────┴──────────────────────────────────────────────────────┤
│ [kapak] Şarkı adı          ☆  ⏮  ⏯  ⏭        CANLI · 02:15   🔈 ━━━│
│         Sanatçı · İstasyon                                           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Sol kenar çubuğu:** ana kategoriler (Bulunduğum ülke, Popüler, Favoriler, Son dinlenenler) ve ülke/tür gezgini.
- **Orta alan:** seçilen kategorinin istasyon kartları. Çalan istasyonun kartında hareketli eşitleyici görünür.
- **Alt oynatıcı çubuğu:** kapak, şarkı/istasyon bilgisi, favori, oynat/durdur, önceki/sonraki, durum (`CANLI · süre`, `Bağlanıyor…`, `Tamponlanıyor…`, `Bağlantı kurulamadı`), sessize alma ve ses.

---

## Kurulum — Windows

### Gereksinimler

- Windows 10 veya Windows 11, 64-bit
- Yaklaşık 400 MB boş alan (kurulum sonrası)
- İnternet bağlantısı (radyo yayınları ve katalog için)

### Adımlar

1. Sürüm sayfasından **`Radyn Setup 1.0.0.exe`** dosyasını indirin.
2. Dosyaya çift tıklayın. Windows **"Windows PC'nizi korudu"** uyarısı gösterirse:
   - **Ek bilgi** bağlantısına tıklayın,
   - **Yine de çalıştır** düğmesine basın.

   > Bu uyarı, kurulum dosyasının dijital olarak imzalanmamış olmasından kaynaklanır. Uyarının görünmesi tek başına bir zararlı yazılım göstergesi değildir; ancak dosyanın bütünlüğünü doğrulamak isterseniz [SHA-256 özetini](#sha-256-doğrulaması) kontrol edin.
3. Kurulum sihirbazı kullanıcı klasörüne kurar (yönetici izni gerekmez). Varsayılan konum:
   `%LOCALAPPDATA%\Programs\Radyn`
4. Kurulum sonunda **Radyn**'i Başlat menüsünden veya masaüstü kısayolundan açın.

### Kaldırma

**Ayarlar → Uygulamalar → Radyn → Kaldır**. Favorileriniz ve ayarlarınız (`%APPDATA%\Radyn`) kaldırmada otomatik silinmeyebilir; tamamen temizlemek için bu klasörü de silin.

### SHA-256 doğrulaması

PowerShell'de:

```powershell
Get-FileHash ".\Radyn Setup 1.0.0.exe" -Algorithm SHA256
```

Çıktı, sürüm notlarında yayınlanan özetle aynı olmalıdır.

---

## Kurulum — Linux

Linux için iki yol vardır: **kaynak koddan çalıştırma** (en kolay ve test edilmiş yol) ve **paketli kurulum**.

### Gereksinimler

- 64-bit Linux. Belirli dağıtımlar test edilmedi; Electron'u destekleyen güncel dağıtımlarda çalışması beklenir.
- Node.js 20 veya üzeri, npm
- Masaüstü ortamı (GNOME, KDE, XFCE vb.)
- MPRIS için: DBus oturumu (masaüstü ortamlarında varsayılan olarak bulunur)
- Electron'un ihtiyaç duyduğu sistem kütüphaneleri (bkz. [Hata giderme](#hata-giderme-sorun-çözme): *"error while loading shared libraries"*)

### Yol A — Kaynak koddan çalıştırma

```bash
# 1) Node.js kurulu mu?
node -v        # v20 veya üzeri olmalı

# 2) Proje klasörüne girin
cd /ruta/proje-klasoru

# 3) Bağımlılıkları kurun (Electron ikilisi de indirilir)
npm install

# 4) Başlatın
npm start
```

### Yol B — Paketli kurulum (uygulama menüsüne eklemek için)

```bash
# Paketlenmiş klasörü üretin (dist/linux-unpacked)
npx electron-builder --linux dir

# Kullanıcı dizinine kurun (kök yetkisi gerekmez)
./scripts/install-linux.sh

# Çalıştırın
~/.local/share/radyn/radyn
```

Kurulum betiği şunları yapar: uygulamayı `~/.local/share/radyn` altına kopyalar, `chrome-sandbox` ve `radyn` dosyalarına çalıştırma izni verir, simgeyi `~/.local/share/icons` altına koyar ve `~/.local/share/applications/radyn.desktop` masaüstü girişini oluşturur.

Kaldırmak için:

```bash
rm -rf ~/.local/share/radyn ~/.local/share/applications/radyn.desktop ~/.local/share/icons/hicolor/512x512/apps/radyn.png
```

### Yol C — AppImage veya .deb (Linux'ta üretilir)

```bash
npm run dist:linux     # dist/ içinde Radyn-1.0.0.AppImage ve radyn_1.0.0_amd64.deb
```

- **AppImage:** `chmod +x Radyn-1.0.0.AppImage` ve çift tıklayın ya da `./Radyn-1.0.0.AppImage` ile çalıştırın.
- **.deb:** `sudo apt install ./radyn_1.0.0_amd64.deb`

> AppImage ve .deb dosyaları Windows'ta üretilemez; Linux'ta derlemeniz gerekir.

---

## Kaynak koddan çalıştırma (geliştiriciler)

```powershell
# Windows (PowerShell)
cd C:\Users\Admin\Documents\radio
npm install
npm start          # uygulamayı açar; hatalar bu terminale yazılır
npm test           # 28 birim/entegrasyon testi
npm run icons      # ikonları assets/ klasörüne yeniden üretir
```

`npm install` sırasında Electron ikilisi indirilir. Ağınız GitHub'a erişmiyorsa veya indirme yarıda kalırsa:

```powershell
# İndirme aynasını belirtin (kurumsal ağ / yavaş bağlantı)
$env:ELECTRON_MIRROR = "https://kurumsal-ayna-adresiniz/electron/"   # kendi ayna adresinizi yazın
npm install
```

Ya da `node_modules\electron` klasörünü silip `npm install` komutunu yeniden çalıştırın.

---

## Kullanım kılavuzu

### 1. İlk açılış

Uygulama açılınca **"Bulunduğum ülke"** görünümü gelir. IP adresinizden ülkenizi bulur ve o ülkenin istasyonlarını listeler. Ülke bulunamazsa veya o ülkede istasyon yoksa **Popüler** listesi açılır.

### 2. Ülke ve tür ile gezinme

- Sol alttaki **Ülkeler** sekmesinden bir ülkeye tıklayın; listedeki istasyonlar o ülkenin en çok oy alanlarıdır.
- **Türler** sekmesine geçip `jazz`, `news`, `pop` gibi bir türe tıklayın.
- Listenin üstündeki **"Listede ara…"** kutusu ülke/tür adını filtreler.

### 3. Arama

Üst sağdaki arama kutusuna istasyon adını yazıp Enter'a basın (ya da `Ctrl+F` ile kutuya gidin). Sonuçlar dünya genelindendir.

### 4. Bir istasyonu çalmak

- Karta tıklayın veya kart odaktayken Enter'a basın.
- Alt çubuktaki **⏯** düğmesi, çalan istasyonu durdurur; durmuş istasyonda aynı düğme yeniden başlatır.
- **⏮ / ⏭** düğmeleri, istasyonun bulunduğu liste içinde önceki/sonraki istasyona geçer.

Durum satırında şunları görürsünüz:

| Durum | Anlamı |
|---|---|
| `Bağlanıyor…` | Yayına bağlanılıyor |
| `Tamponlanıyor…` | Veri bekleniyor (ağ yavaş olabilir) |
| `CANLI · 02:15` | Yayın çalıyor, süre bu oturumdan beri |
| `Bağlantı kurulamadı` | 3 yeniden deneme de başarısız oldu — [hata giderme](#istasyon-bağlantı-kurulamadı-diyor) |
| `Durduruldu` | Yayın durduruldu |

### 5. Şu an çalan parça

Yayın şarkı bilgisi gönderiyorsa alt çubukta **şarkı adı** ve **sanatçı** görünür. Uygulama bu bilgiyle iTunes kataloğunda eşleşen bir albüm kapağı arar; bulunursa kapak gösterilir, bulunamazsa istasyon logosu gösterilir.

### 6. Favoriler ve son dinlenenler

- Kartın sağ üstündeki **☆** ile favoriye ekleyin; **★** ile çıkarın. Alt çubuktaki ★ de çalan istasyon için çalışır.
- **Favoriler** ve **Son dinlenenler** menüsü kalıcıdır.

### 7. Ses ve sessize alma

- Alt çubuktaki kaydırıcı ses seviyesini ayarlar.
- Ses simgesine tıklayın veya **`M`** tuşuna basın: ses kapanır, simge kapalı-ses olur. Tekrar basınca ses, kaydırıcının kaldığı seviyeden açılır.
- Kaydırıcıyı oynatmak da sesi açar.

### 8. Pencere, tepsi ve çıkış

- Pencerenin **X** düğmesi uygulamayı **kapatmaz**; tepsiye küçülür ve yayın kesilmez.
- Tepsi simgesine tek tıklama pencereyi açar/gizler.
- Tamamen çıkmak için tepsi simgesine sağ tıklayın → **Çıkış**.
- Uygulamayı ikinci kez açmaya çalışırsanız mevcut pencere öne gelir (ikinci kopya açılmaz).

### 9. Windows görev çubuğu

Radyn açıkken görev çubuğundaki simgenin üzerine gelin; pencere önizlemesinin altında **Önceki**, **Oynat/Durdur** ve **Sonraki** düğmeleri görünür. Düğme simgesi çalan duruma göre değişir ve görev çubuğu ipucunda çalan istasyon adı yazar.

### 10. Medya tuşları

Klavyenizdeki **Oynat/Duraklat**, **Sonraki**, **Önceki** ve **Durdur** tuşları, uygulama açıkken (pencere gizli olsa bile) yayını kontrol eder. Başka bir medya uygulaması aynı tuşları kullanıyorsa [hata giderme](#medya-tuşları-çalışmıyor) bölümüne bakın.

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

## Verileriniz ve dosya konumları

Radyn hesap istemez; her şey yerel olarak saklanır. Kalıcı veriler tek bir JSON dosyasındadır:

| İşletim sistemi | Konum |
|---|---|
| Windows | `%APPDATA%\Radyn\veri.json` |
| Linux | `~/.config/Radyn/veri.json` |

Dosyanın yapısı:

```json
{
  "favorites": [ { "uuid": "...", "name": "...", "url": "...", "favicon": "...", "country": "...", "countryCode": "TR", "tags": [], "codec": "MP3", "bitrate": 128 } ],
  "recent": [ ],
  "settings": { "volume": 0.8 }
}
```

- **Favorileri yedeklemek:** `veri.json` dosyasını kopyalayın.
- **Her şeyi sıfırlamak:** Radyn'i kapatın, `veri.json` dosyasını silin, uygulamayı yeniden açın.
- **Bozuk dosya:** JSON okunamazsa Radyn varsayılan boş verilerle açılır; bir sonraki kayıtta dosya yeniden yazılır. Bozuk dosyayı silmeden önce yedeğini almak isterseniz dosyayı başka bir yere kopyalayın.

---

## Gizlilik ve ağ trafiği

Radyn şu dış servislere bağlanır. Her birinin ne gördüğünü bilmeniz için listeledik:

| Servis | Ne zaman | Gönderilen |
|---|---|---|
| `de1/nl1/at1.api.radio-browser.info` | Katalog, ülke/tür listeleri, arama, tıklama sayacı | İstek parametreleri (ülke kodu, arama metni) ve istasyon kimliği (tıklama sayacı için) |
| `ipapi.co`, `ipwho.is` | Açılışta, oturum başına bir kez | **IP adresiniz** (servis tarafından görülür); yanıt olarak yalnızca ülke kodu alınır |
| `itunes.apple.com` | Yeni bir şarkı bilgisi geldiğinde | Sanatçı ve şarkı adı (kapak aramak için) |
| Yayın sunucuları (istasyonun kendi adresi) | Çalınan istasyon | Standart HTTP/HLS istekleri; ICY metadatası için ikinci bir bağlantı |

Radyn hesap, izleme veya telemetri içermez. Konum sorgusu açılışta yapılır. Şu an bunu kapatan bir ayar yoktur; kaynak koddan çalışıyorsanız `renderer/app.js` içindeki `init` fonksiyonunda `showView('home')` çağrısını `showView('top')` ile değiştirirseniz açılışta IP sorgusu yapılmaz (**Bulunduğum ülke** menüsüne tıklamadığınız sürece).

---

## Hata giderme (sorun çözme)

Aşağıdaki başlıklar, uygulamanın gösterdiği mesajlara veya belirtilere göre düzenlenmiştir. Bir sorun için önce ilgili başlığa bakın; çözülmezse [hata raporu](#hata-raporu-nasıl-hazırlanır) bölümündeki bilgileri toplayın.

### Kurulum ve başlatma

#### "Windows PC'nizi korudu" uyarısı çıkıyor
Kurulum dosyası dijital olarak imzalanmamış. **Ek bilgi → Yine de çalıştır** ile devam edebilirsiniz. Bütünlüğü doğrulamak için [SHA-256 özetini](#sha-256-doğrulaması) karşılaştırın.

#### Kurulum sırasında "Bu uygulama bilgisayarınızda değişiklik yapmasına izin vermiyor"
Kurulum kullanıcı klasörüne yapıldığı için yönetici izni gerekmez. Dosyayı sağ tıklayıp **Yönetici olarak çalıştır** yerine düz çift tıklama ile deneyin. Hâlâ engelleniyorsa antivirüs yazılımınızın karantina kaydına bakın.

#### `npm install` Electron indirirken takılıyor ya da hata veriyor (`ETIMEDOUT`, `ECONNRESET`, `Electron failed to install correctly`)
- Ağ bağlantınızı kontrol edin; kurumsal ağda proxy ayarlarını yapın.
- `ELECTRON_MIRROR` ile bir ayna kullanın (bkz. [Kaynak koddan çalıştırma](#kaynak-koddan-çalıştırma-geliştiriciler)).
- Yarıda kalan kurulumu temizleyin: `node_modules` klasörünü silin ve `npm install` komutunu yeniden çalıştırın.

#### `npm start` "electron.exe bulunamadı" veya "Electron failed to install correctly" diyor
`node_modules\electron` klasörü eksik ya da bozuk. Silip yeniden kurun:

```powershell
Remove-Item -Recurse -Force node_modules\electron
npm install
```

#### Linux: `error while loading shared libraries: libXXX.so.N: cannot open shared object file`
Electron'un ihtiyaç duyduğu bir sistem kütüphanesi yok. Dağıtımınıza göre eksik paketi kurun. Debian/Ubuntu için sık görülen paketler:

```bash
sudo apt install libnss3 libatk-bridge2.0-0 libgtk-3-0 libasound2 libxss1 libgbm1 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2
```

Hata mesajındaki `libXXX.so` adını arayıp (ör. `apt search libxxx`) paketi bulabilirsiniz.

#### Linux: `The SUID sandbox helper binary was found, but is not configured correctly`
`chrome-sandbox` dosyasının izinleri yanlış. Kurulum betiği bunu düzeltir; elle yapmak için:

```bash
sudo chown root:root ~/.local/share/radyn/chrome-sandbox
sudo chmod 4755 ~/.local/share/radyn/chrome-sandbox
```

#### Linux: `No usable sandbox!` veya Electron açılmadan kapanıyor
Ubuntu 23.10/24.04 gibi dağıtımlar, kullanıcı ad alanlarını (user namespaces) AppArmor ile kısıtlayabilir. Önerilen çözüm, Electron için bir AppArmor profili tanımlamak veya sistem yöneticinizle birlikte ilgili ayarı değerlendirmektir. `--no-sandbox` bayrağı güvenliği düşürdüğü için **varsayılan olarak kullanılmamalıdır**; kullanmanız gerekiyorsa yalnızca kendi makinenizde ve bilerek yapın.

#### Linux: `Permission denied` ile açılmıyor
Çalıştırma izni yok:

```bash
chmod +x ~/.local/share/radyn/radyn ~/.local/share/radyn/chrome-sandbox
```

#### Uygulama açılıyor ama hemen kapanıyor
Sorunu görmek için uygulamayı terminalden başlatın (`npm start` veya kurulu sürüm için `"%LOCALAPPDATA%\Programs\Radyn\Radyn.exe"` Windows'ta PowerShell'den; Linux'ta `~/.local/share/radyn/radyn`). Terminaldeki hata satırı çoğu zaman nedeni gösterir.

#### Başka bir Radyn penceresi açılmıyor, mevcut pencere öne gelmiyor
Uygulama zaten çalışıyor olabilir ama tepsidedir. Tepsi simgesine tıklayın; ya da görev yöneticisinde `Radyn` süreçlerini sonlandırıp yeniden açın.

### Katalog ve listeler

#### "Radyo veritabanına ulaşılamadı (...)" hatası
Radyo kataloğuna (Radio Browser) bağlanılamadı. Sırasıyla kontrol edin:
1. İnternet bağlantınız çalışıyor mu? (Bir web sitesi açmayı deneyin.)
2. Güvenlik duvarı, antivirüs veya kurumsal proxy `*.api.radio-browser.info` adreslerini engelliyor mu?
3. Birkaç dakika sonra ülke/tür listesini yeniden açın. Radyo kataloğu topluluk tarafından işletilir; geçici olarak yavaşlayabilir. Uygulama üç sunucuyu sırayla dener.

#### Ülke listesi boş ya da "Liste alınamadı: ..." mesajı
Yukarıdaki maddeyle aynı. Listenin altındaki mesajın son kısmındaki ayrıntı (`HTTP 503` gibi) sunucunun geçici olarak yanıt vermediğini gösterir; birkaç dakika sonra tekrar deneyin.

#### "Konumunuz: ..." yerine Popüler listesi açıldı
Bu bir hata değil, bir geri dönüş davranışıdır. Olası nedenler:
- IP konum servisleri ulaşılamadı → işletim sistemi bölge ayarı kullanılır; o da yoksa Popüler açılır.
- Konumunuzdaki ülkede kayıtlı istasyon yok → Popüler açılır ve üstte "… için istasyon bulunamadı" yazar.
- VPN kullanıyorsanız VPN'in çıkış ülkesi tespit edilir; istediğiniz ülkeyi **Ülkeler** listesinden seçebilirsiniz.

#### Konum yanlış ülkeyi gösteriyor
IP tabanlı konum her zaman kesin değildir (VPN, mobil operatör, kurumsal çıkış noktası). **Ülkeler** sekmesinden doğru ülkeyi seçin. Uygulama yanlış konumu hatırlamaz; her açılışta yeniden arar.

#### Arama sonuç vermiyor
- Daha kısa ya da farklı bir ad deneyin (örn. `radio` yerine `fm`).
- Arama istasyon **adına** göre yapılır; tür veya ülke yazmak için **Türler** ya da **Ülkeler** sekmesini kullanın.
- Çalışmayan (`hidebroken`) istasyonlar sonuçlarda gösterilmez; bu beklenen davranıştır.

#### Bir ülkedeki istasyonların bazıları çalmıyor
Radio Browser kataloğundaki kayıtların bir kısmı zamanla çevrimdışı olur. Radyn çalışmayanları listelemeye çalışmaz, ancak kayıt yeni kapanmış olabilir. Başka bir istasyon deneyin; ya da istasyon kataloğu güncellenene kadar bekleyin.

### Oynatma ve ses

#### Ses hiç çıkmıyor
Sırayla kontrol edin:
1. **Sessize alma:** Ses simgesi kapalı-ses görünümündeyse `M` tuşuna basın ya da simgeye tıklayın.
2. **Uygulama ses seviyesi:** Windows Ses Karıştırıcısı'nda (`Ses ayarları → Uygulama ses ayarları`) Radyn'in sesi kısık ya da kapalı olmasın.
3. **Çıkış aygıtı:** Doğru hoparlör/kulaklık seçili mi?
4. **Yayın:** Başka bir istasyon deneyin. Bazı yayınlar bölgeye ya da saate göre kapalı olabilir.
5. Linux'ta: masaüstü ses sunucunuzun (PipeWire/PulseAudio) çalıştığını doğrulayın.

#### İstasyon "Bağlantı kurulamadı" diyor
Radyn üç kez yeniden bağlanmayı denedi ve yayın açılamadı. Nedenler:
- Yayın sunucusu kapalı veya istasyon çevrimdışı → başka bir istasyon deneyin.
- Güvenlik duvarı yayın portunu engelliyor (genelde 80, 443, 8000, 8080 gibi portlar).
- Yayın sunucusu IP/bölge kısıtlaması uyguluyor → VPN'i kapatıp deneyin ya da farklı bir istasyon seçin.
- Yayın `m3u8` (HLS) formatında ve tarayıcı motoru yayına erişemiyor → bağlantı ağınızı kontrol edin.

#### Yayın sık sık kesiliyor, "Tamponlanıyor…" çok görünüyor
- Wi-Fi yerine kablolu bağlantı deneyin.
- Başka ağır indirme/yayın uygulamalarını kapatın.
- 320 kbps gibi yüksek bitrate'li yayınlar daha fazla veri ister; 128 kbps bir istasyonu deneyin.

#### Yayın gecikmeli ya da "CANLI" yazmasına rağmen eski içerik çalıyor
Canlı radyo yayınları genellikle birkaç saniye geriden gelir; bu normaldir. Radyn duraklatma sonrasında yayını yeniden bağlar (canlı yayın duraklatılamaz, durdurulup yeniden başlatılır).

#### Oynat düğmesine basınca bir şey olmuyor
- Önce durum satırına bakın: `Bağlanıyor…` görünüyorsa biraz bekleyin.
- Başka bir istasyon seçmeyi deneyin.
- Uygulamayı yeniden başlatın.

### Şarkı bilgisi ve albüm kapağı

#### Şarkı adı hiç görünmüyor
Şarkı bilgisi yalnızca yayın **ICY metadatası** gönderiyorsa görünür. Çoğu Shoutcast/Icecast MP3/AAC yayını bunu gönderir, ancak bazıları göndermez. Ayrıca HLS (`m3u8`) yayınlarında bu özellik desteklenmez. Yayın kendi sitesinde şarkı bilgisi gösteriyor olsa bile uygulama onu okuyamıyorsa bu bir sınırlamadır.

#### Şarkı adı yanlış ya da reklam metni görünüyor
Bazı yayınlar şarkı yerine istasyon adını, reklamı veya saat bilgisini gönderir. Bu yayın kaynağından gelir; Radyn değiştiremez.

#### Albüm kapağı görünmüyor, logo görünüyor
iTunes kataloğunda sanatçı ve parça adı eşleşmedi. Bu bilinçli bir tercihtir: yanlış kapak göstermemek için sadece eşleşen sonuçlar kullanılır. Yayın şarkı adını tam ve standart biçimde (`Sanatçı - Şarkı`) vermiyorsa eşleşme olmayabilir.

#### Kapak çok geç geliyor
Kapak, şarkı bilgisi geldikten sonra arka planda aranır (en fazla 8 sn). Sonuç önbelleğe alınır; aynı şarkı tekrar çalınırsa anında gelir.

### Görev çubuğu, tepsi ve medya tuşları

#### Windows görev çubuğunda düğmeler (Önceki/Oynat/Sonraki) görünmüyor
- Düğmeler pencere küçük resminde görünür: görev çubuğundaki Radyn simgesinin üzerine gelin. Pencere tepsiye gizlenmişse görev çubuğunda simge yoktur; tepsiden **Pencereyi göster** deyin.
- Windows'un yeni sürümlerinde küçük resim düğmeleri, önizlemenin altında gösterilir; önizleme kapalıysa görünmez.

#### Tepsi simgesi görünmüyor (Linux)
- GNOME'da tepsi simgeleri varsayılan olarak yoktur. **AppIndicator and KStatusNotifierItem Support** (ya da benzeri) eklentisini kurun ve etkinleştirin.
- KDE ve XFCE'de genelde sorunsuz çalışır.
- Tepsi olmasa bile uygulamayı yeniden başlatmak (ikinci kopya açmak) pencereyi öne getirir.

#### Medya tuşları çalışmıyor
- Medya tuşları genel kısayol olarak kaydedilir. Spotify, Groove, VLC gibi başka bir uygulama aynı tuşları önce aldıysa Radyn tepkisiz kalır. O uygulamayı kapatın ya da tuşu ona bırakın.
- Bazı dizüstü bilgisayarlarda medya tuşları işletim sistemi kısayolu olarak çalışır; bu durumda `Fn` tuşuyla birlikte basmanız gerekebilir.
- Uygulama tepsideyken de çalışır; pencere kapalı olması sorun değildir.

#### Linux medya panelinde Radyn görünmüyor
MPRIS, `mpris-service` paketi kurulu ve DBus oturumu çalışıyorsa etkindir. Kaynak koddan çalıştırıyorsanız `npm install` komutunun `mpris-service` paketini kurduğundan emin olun (isteğe bağlı bağımlılık olduğu için hata vermeden atlanabilir). Konsolda `MPRIS başlatılamadı` mesajı varsa DBus oturumunu kontrol edin.

### Pencere ve kapatma davranışı

#### Pencereyi kapattım ama uygulama açık kaldı
Bu tasarımdır: X düğmesi uygulamayı tepsiye küçültür, yayın kesilmez. Tamamen kapatmak için tepsi simgesine sağ tıklayıp **Çıkış** seçin. Linux'ta tepsi simgesi görünmüyorsa uygulamayı `pkill -f radyn` ile sonlandırabilirsiniz.

#### Uygulama kapanmıyor / Görev yöneticisinde kalıyor
Tepsi menüsünden **Çıkış** deneyin. Çalışmıyorsa görev yöneticisinde `Radyn` süreçlerini sonlandırın. Veriler kaybolmaz; favoriler ve ses ayarı her kapanışta kaydedilir.

### Favoriler ve veriler

#### Favorilerim kayboldu
- `%APPDATA%\Radyn\veri.json` (Windows) ya da `~/.config/Radyn/veri.json` (Linux) dosyasının varlığını kontrol edin.
- Dosya bozulmuşsa uygulama boş verilerle açılır. Dosyayı silmeden önce yedeğini alın.
- Farklı bir bilgisayardan kopyalıyorsanız dosyayı doğru klasöre koyduğunuzdan emin olun; kullanıcı adı değişmiş olabilir.

#### Ses seviyem her açılışta değişiyor
Ses seviyesi `veri.json` içindeki `settings.volume` alanında saklanır ve her değişiklikte kaydedilir (300 ms gecikmeyle). Dosya yazılamıyorsa (salt okunur klasör, dolu disk) kayıt yapılamaz; konsolda `Veriler kaydedilemedi` mesajına bakın.

### Diğer

#### Yüksek internet/veri kullanımı
Her çalan istasyon için Radyn şarkı bilgisini okumak üzere ikinci bir bağlantı açar. Bu, yayın verisini kabaca iki katına çıkarabilir. Mobil veri kullanıyorsanız dikkat edin.

#### Radyn yazı tiplerini tanımıyor / arayüz garip görünüyor
Arayüz Windows'ta **Segoe UI Variable**, Linux'ta sistem yazı tipini kullanır. Yazı tipi yoksa tarayıcı motoru yedek yazı tipine geçer; bu normaldir.

---

## Hata raporu nasıl hazırlanır

Bir sorun çözülmediyse şu bilgileri toplayın (bunlar kişisel veri içermez; istasyon adlarını paylaşmak isteğe bağlıdır):

1. **Sürüm ve sistem:** Windows sürümü (ör. 10 22H2, 11 23H2) ya da Linux dağıtımı ve sürümü (`lsb_release -a`), CPU mimarisi.
2. **Radyn sürümü:** Ayarlar → Uygulamalar listesinde ya da kurulum klasöründeki `package.json`'daki `version`.
3. **Kaynak:** Kurulum dosyası (`Radyn Setup 1.0.0.exe`), paketli klasör veya `npm start`.
4. **Adımlar:** Hatayı tetikleyen işlemler (ör. "Türkiye kategorisine tıkladım, 500 istasyon geldi, bir istasyonu çalınca 'Bağlantı kurulamadı' çıktı").
5. **Ekran mesajı:** Durum satırındaki ya da listedeki kırmızı/gri hata metni (tam olarak).
6. **Terminal çıktısı:** `npm start` ile başlatılmış bir oturumda hata satırları (`Error`, `ERR`, `MPRIS`, `Veriler kaydedilemedi` gibi).
7. **İstasyon bilgisi (varsa):** Sorunlu istasyonun adı ve ülkesi. Yayın adresini (URL) paylaşmak isteğe bağlıdır.

Hata raporlarında `veri.json` dosyanızın tamamını paylaşmayın; favorileriniz ve son dinlemeleriniz içinde olabilir.

---

## Geliştirici rehberi

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm install` | Bağımlılıkları ve Electron'u kurar |
| `npm start` | Uygulamayı geliştirme modunda açar |
| `npm test` | `node:test` ile 28 testi çalıştırır |
| `npm run icons` | `scripts/make-icons.js` ile görev çubuğu düğmelerini ve tepsi ikonunu üretir |
| `npm run dist:win` | Windows NSIS kurulum dosyasını `dist/` içine üretir |
| `npm run dist:linux` | AppImage ve .deb üretir (**Linux'ta çalıştırın**) |
| `npx electron-builder --linux dir` | Linux paketli klasörünü üretir (`dist/linux-unpacked`) |

### Proje yapısı

```
radio/
├── main.js              Ana süreç: pencere, tepsi, görev çubuğu düğmeleri, medya tuşları, IPC
├── preload.js           Arayüze açılan sınırlı köprü (window.radio)
├── src/
│   ├── radio-api.js     Radio Browser istemcisi (sunucu yedeklemeli, User-Agent gönderir)
│   ├── icy.js           ICY şarkı bilgisi okuyucusu (yeniden bağlanma dahil)
│   ├── art.js           Albüm kapağı arayıcı (iTunes Search, eşleşme kontrolü, önbellek)
│   ├── geo.js           IP tabanlı ülke tespiti (yedek: işletim sistemi bölgesi)
│   ├── store.js         Favoriler, son dinlenenler, ayarlar (JSON, atomik yazma)
│   └── mpris.js         Linux MPRIS entegrasyonu (isteğe bağlı)
├── renderer/
│   ├── index.html       Arayüz iskeleti ve SVG simge seti
│   ├── styles.css       Tema belirteçleri (açık/koyu), düzen
│   ├── app.js           Arayüz mantığı: gezinme, oynatma kuyruğu, favoriler, sessize alma
│   └── logo-mark.png    Kenar çubuğu logosu
├── assets/              Uygulama ikonu, tepsi ikonu, görev çubuğu düğmeleri
├── packaging/
│   └── radyn.desktop    Linux masaüstü giriş dosyası şablonu
├── scripts/
│   ├── make-icons.js    Simge üretici (bağımlılıksız PNG kodlayıcı)
│   └── install-linux.sh Linux kullanıcı kurulum betiği
└── test/                node:test testleri (API, ICY, kapak, depo, konum)
```

### Mimari özeti

- **Renderer** hiçbir Node/Electron nesnesine doğrudan erişmez; yalnızca `preload.js` ile açılan `window.radio` köprüsünü kullanır. `contextIsolation` ve `sandbox` açıktır.
- **Dış HTTP istekleri** (radyo kataloğu, IP tespiti, iTunes) ana süreçte yapılır; bu sayede tarayıcı CORS kısıtlamalarına takılmaz ve User-Agent kontrol altında kalır.
- **Şarkı bilgisi** ayrı bir ICY bağlantısıyla okunur; oynatma ise renderer'daki `<audio>` (veya HLS için hls.js) ile yapılır.
- **Durum senkronizasyonu:** Renderer, oynatma durumunu `state` mesajıyla ana sürece bildirir; ana süreç pencere başlığını, tepsi ipucunu, görev çubuğu düğmelerini ve MPRIS'i bu tek kaynaktan günceller.
- **Güvenlik:** Pencere dışına gezinme engellenir, yeni pencereler açılmaz, bağlantılar varsayılan tarayıcıda açılır. Arayüz verileri `textContent` ile yazılır (istasyon adlarında HTML enjeksiyonu yoktur). CSP meta etiketi aktiftir.

### Testler

```
npm test
```

| Dosya | Kapsam |
|---|---|
| `test/radio-api.test.js` | İstasyon normalizasyonu, sunucu yedeklemesi, ülke adları (Intl), geçersiz girdi reddi |
| `test/icy.test.js` | ICY ayrıştırma, parça parça veri, **yerel HTTP sunucusuyla uçtan uca** şarkı bilgisi, ICY desteklemeyen akış |
| `test/art-store.test.js` | Kapak eşleşmesi, önbellek, hata durumunda önbelleğe almama, favori/son dinlenen/bozuk dosya |
| `test/geo.test.js` | Ülke kodu doğrulama, servis yedeklemesi, işletim sistemi bölgesine düşme |

### Windows paketi

`npm run dist:win` şu çıktıları üretir:

- `dist/Radyn Setup 1.0.0.exe` — kurulum dosyası (NSIS, kullanıcı kurulumu)
- `dist/win-unpacked/Radyn.exe` — kurulum gerektirmeyen paketli sürüm

Kurulum dosyası **imzalanmamıştır**. Yayın için kod imzalama sertifikası eklenirse `package.json` içindeki `build.win` bölümüne `certificateFile` ve `certificatePassword` ortam değişkenleriyle ayar eklenebilir.

### Linux paketi

- `npx electron-builder --linux dir` Windows'ta da çalışır; ancak `dist/linux-unpacked/radyn` dosyasında çalıştırma izni NTFS üzerinde korunmaz. Bu yüzden kurulum betiği izinleri kopyalamadan sonra yeniden verir.
- AppImage ve .deb üretimi için **Linux** gerekir (`mksquashfs` ve sembolik bağlantı desteği).

---

## Bilinen sınırlamalar

- **Şarkı bilgisi** ICY metadatası gönderen yayınlarla sınırlıdır; HLS yayınlarında gösterilmez.
- **Albüm kapağı** iTunes kataloğuna bağlıdır; her şarkı bulunamaz ve kapak yalnızca eşleşen sonuçlarda gösterilir.
- **Katalog** topluluk tarafından işletilir; bazı istasyonlar çevrimdışı ya da hatalı meta bilgili olabilir.
- **Canlı yayın duraklatılamaz**; durdurulup yeniden başlatılır.
- **Görev çubuğu düğmeleri** yalnızca Windows'ta, **tepsi** ise bazı Linux masaüstlerinde (GNOME'da eklenti gerekir) kullanılabilir.
- **Linux** kurulumu ve paketleri bu sürümde yalnızca dolaylı olarak doğrulanmıştır (paketlenmiş klasör üretildi; uygulamanın Linux'ta çalıştığı henüz test edilmedi).
- **Kurulum dosyası imzasızdır**; Windows SmartScreen uyarısı görünür.
- **Ses kaydı, ekran görüntüsü veya yayın kaydı** özelliği yoktur.
- **Çoklu dil:** Arayüz yalnızca Türkçedir.

---

## Sürüm notları

Ayrıntılar için [RELEASE_NOTES.md](RELEASE_NOTES.md) dosyasına bakın.

## Lisans

Bu proje henüz bir lisansla yayımlanmamıştır (`package.json` içinde `"private": true`). Kullanım ve dağıtım koşulları için proje sahibine danışın.
