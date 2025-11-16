
# StayIn Frontend

Bu klasör, StayIn web uygulamasının kullanıcı arayüzünü (frontend) içerir. Proje Vue.js, Vite ve Tailwind CSS kullanılarak geliştirilmiştir.

## Özellikler

- Kullanıcı kayıt ve giriş işlemleri
- Şifre sıfırlama (modal üzerinden)
- Favori ilanları ekleme ve görüntüleme
- İlan arama ve filtreleme
- İlan detaylarını görüntüleme
- Kendi ilanlarını yönetme (ekleme, düzenleme, silme)
- Rezervasyon işlemleri (eklenecek)
- Profil görüntüleme ve güncelleme (eklenecek)
- Modern ve duyarlı arayüz

## Klasör Yapısı

- `src/components/` : Modallar, arama çubuğu ve diğer arayüz bileşenleri
- `src/views/` : Sayfa bazlı bileşenler (Ana sayfa, Favoriler, Profil, Rezervasyonlar, vb.)
- `src/router/` : Vue Router ile sayfa yönlendirme
- `src/services/api.js` : Backend API ile iletişim fonksiyonları
- `src/stores/userStore.js` : Kullanıcı oturumu ve verileri için Pinia store

## Kurulum

1. Bağımlılıkları yükleyin:
	```
	npm install
	```
2. Uygulamayı başlatın:
	```
	npm run dev
	```

## Notlar
- Arayüz Tailwind CSS ile tasarlanmıştır.
- API istekleri için `src/services/api.js` dosyasını kullanabilirsiniz.
- Geliştirme sırasında canlı yenileme (hot reload) desteği vardır.
