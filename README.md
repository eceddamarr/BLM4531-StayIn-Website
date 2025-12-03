# StayIn Projesi

StayIn, konaklama ve rezervasyon işlemlerini yönetmek için geliştirilmiş tam kapsamlı bir web uygulamasıdır. Proje iki ana bileşenden oluşur:

- **Backend:** ASP.NET Core ile geliştirilmiş RESTful API
- **Frontend:** Vue.js, Vite ve Tailwind CSS ile geliştirilmiş kullanıcı arayüzü

## Genel Özellikler

- Kullanıcı kayıt ve giriş işlemleri
- Şifre sıfırlama
- Favori ilanları ekleme ve görüntüleme
- İlan arama, filtreleme ve detay görüntüleme
- Kendi ilanlarını yönetme (ekleme, düzenleme, silme)
- Yorumlar ve değerlendirmeler: kullanıcılar ilanlara yorum bırakabilir ve puan verebilir
- Rezervasyon ve ödeme: rezervasyon oluşturma, rezervasyon takibi ve temel ödeme akışları (ödeme sağlayıcı entegrasyonu gerekebilir)
- Modern ve duyarlı arayüz

## Backend (stayin-backend)

- ASP.NET Core tabanlı RESTful API
- JWT tabanlı kimlik doğrulama
- Entity Framework Core ile veritabanı yönetimi
- E-posta işlemleri için servis
- Temel endpointler:
  - Kullanıcı işlemleri: kayıt, giriş, şifre sıfırlama
  - İlan işlemleri: listeleme, detay, arama, ekleme, düzenleme, silme
  - Favori işlemleri: ekleme, silme, listeleme
  - Profil işlemleri: görüntüleme, güncelleme

### Çalıştırma
1. Bağımlılıkları yükleyin:
   ```
   dotnet restore
   ```
2. Veritabanı migrasyonlarını uygulayın:
   ```
   dotnet ef database update
   ```
3. Uygulamayı başlatın:
   ```
   dotnet run
   ```

## Frontend (stayin-frontend)

- Vue.js, Vite ve Tailwind CSS ile geliştirilmiş SPA
- Kullanıcı dostu ve mobil uyumlu arayüz
- API ile iletişim için servis katmanı
- Pinia ile oturum ve kullanıcı yönetimi
- Sayfa yönlendirme için Vue Router
- Temel bileşenler: modallar, arama çubuğu, ilan kartları, profil ve favoriler

### Çalıştırma
1. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
2. Uygulamayı başlatın:
   ```
   npm run dev
   ```

## Klasör Yapısı
- `stayin-backend/` : Sunucu tarafı kodları
- `stayin-frontend/` : Kullanıcı arayüzü kodları


---
Bu özet README, StayIn projesinin genel yapısını ve temel kurulum adımlarını açıklar. Detaylar için ilgili backend ve frontend klasörlerindeki README dosyalarını inceleyebilirsiniz.
