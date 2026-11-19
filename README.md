# Shield (çalışma adı)

Coreo'nun ilk ürünü. Türk KOBİ'leri için AI kullanım kontrolü: çalışanlar ChatGPT, Gemini, Claude ve Copilot'u kullanmaya devam eder. Eklenti hassas veriyi cihazda bulur. Şirkete yalnız sayılar gider, içerik cihazdan çıkmaz. Patron Röntgen raporunu görür: hangi AI aracı, hangi hassas veri, hangi iş otomasyon adayı.

İsim kesin değil: iç adı Kalkan, İngilizce adayı Shield.

## Katmanlar

| Katman | Ne | Durum |
|---|---|---|
| P0 Görür | Sayan eklenti, yerel tespit, iş türü sayımı, Röntgen raporu | İskelet hazır |
| P1 Durdurur | Maskele ve geri doldur, politika, şirket sözlüğü, kanarya, merkezi kurulum | Başlamadı |
| P2 Kanıtlar | KVKK kanıt raporu, Steward satırı, fiyat, kanal ortağı listesi | Başlamadı |

## Yapı

| Klasör | İş |
|---|---|
| `engine/` | Türkçe tespit kuralları (TCKN, VKN, IBAN, kart, telefon, e-posta, plaka), iş türü sınıflama, AI site listesi, sunucu protokolü. Tek doğruluk kaynağı: eklenti, API ve rapor buradan okur. |
| `extension/` | Chrome ve Edge eklentisi (Manifest V3). İstemi cihazda tarar, günlük sayaç tutar, saatte bir sayıları gönderir. |
| `api/` | Cloudflare Worker + D1. Yalnız protokole uyan sayıları kabul eder; metin taşıyabilecek her alanı reddeder. Rapor ucu şirket anahtarıyla açılır. |
| `report/` | Röntgen raporu: toplamlar, araçlar, hassas veri türleri, iş türleri, departmanlar, otomasyon adayları, KVKK notu. |

## Gizlilik sözü kodda

- `engine` hiçbir zaman eşleşen metni döndürmez, yalnız tür ve sayı döndürür. 100.000 örnekli test bunu doğrular.
- `api` protokolde olmayan her alanı reddeder. Kod alanları yalnız küçük harf, rakam ve tire kabul eder.
- Varsayılan seviye departmandır. Cihaz kimliği rastgeledir, kişi adı yoktur.

## Komutlar

```bash
npm install
npm run ci
```

`npm run ci` sırasıyla tip kontrolü, testler ve derlemeyi çalıştırır. Eklenti `extension/dist/` klasörüne, örnek raporlar `report/dist/` klasörüne çıkar.

## Yerelde deneme

1. `npm run build` çalıştır.
2. Chrome'da `chrome://extensions` aç, Geliştirici modunu aç, `extension/dist` klasörünü yükle.
3. ChatGPT'de bir istem gönder, eklenti simgesine tıkla.
4. Örnek raporu aç: `report/dist/sample.tr.html`.

## Şirkete bağlama

Eklenti şirket ayarını Chrome/Edge kurumsal politikasından (`managed_schema.json`) okur:

| Alan | Örnek |
|---|---|
| `company` | `puls` |
| `department` | `satis` |
| `endpoint` | API adresi |

Ayar yoksa sayılar yalnız cihazda kalır.

## API'yi yayına alma

1. `wrangler d1 create shield` ile veritabanını oluştur ve `api/wrangler.toml` içindeki `database_id` değerini değiştir.
2. `wrangler d1 migrations apply shield --remote` ile tabloyu kur.
3. `wrangler deploy --config api/wrangler.toml` ile Worker'ı yayınla.

## Dokümanlar

Güncel strateji (tek doğruluk kaynağı):

- [Coreo yol haritası v2.2](docs/strateji/Coreo-Yol-Haritasi.pdf)
- [Kalkan MVP taslağı](docs/strateji/Kalkan-MVP-Taslagi.pdf)
- [Puls görüşme rehberi](docs/strateji/Puls-Gorusme-Rehberi.pdf)
- [Coreo rakip haritası](docs/strateji/Coreo-Rakip-Haritasi.pdf)
- [Kurumsal AI planı karşılaştırması](docs/strateji/Plan-Kalkan-Karsilastirma.pdf)

İlk çalışma notları (2026-11-06/07, tarihsel):

- [Roadmap](docs/2026-11-06-Roadmap.md)
- [Mimari](docs/2026-11-06-Mimari.md)
- [Pazar araştırması](docs/2026-11-06-OnPremAI-research.md)
- [Fikir analizi](docs/2026-11-06-FikirAnalizi.md)
- [Rakip araştırması](docs/2026-11-07-RakipAnalizi.md)
