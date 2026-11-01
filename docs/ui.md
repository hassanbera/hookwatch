# Arayüz sistemi

Mantine kullanılır. Koyu operasyon ekranı, camgöbeği vurgu ve teslimat/deneme kayıtları.

## Tema sınırı

src/theme.tsx içindeki createTheme ve MantineProvider.

- Bileşen renkleri, tipografisi ve durumları kütüphanenin açık tema API’sinden yönetilir.
- `src/styles.css` uygulamanın yerleşimini ve iş alanına özel kart/takvim geometrisini tanımlar.
- Kütüphanenin ürettiği iç sınıflara bağlanan seçiciler, `::ng-deep` ve `!important` kullanılmaz.
- Takvim randevuları ve sürüklenen Kanban kartları semantik iş alanı kontrolleridir; sabit yüksekliği olan standart aksiyon butonuna zorlanmaz.
- Formların isimleri, doğrulama alanları ve HTTP sözleşmeleri korunur. Backend katmanları değişmez.

## Kontrol

- Masaüstü: 1440 × 1000; telefon: 390 × 844.
- Gerçek API ve PostgreSQL ile arayüzden kayıt oluşturma doğrulandı.
- Form açma/kapatma ve dar ekran taşmaları kontrol edildi.

[Bileşen kütüphanesi belgeleri](https://mantine.dev)
