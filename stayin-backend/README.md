# StayIn Backend

Bu klasör, StayIn web uygulamasının sunucu tarafı (backend) kodlarını içerir. Backend, ASP.NET Core ile geliştirilmiş olup RESTful API olarak çalışır. Kullanıcı yönetimi, ilan işlemleri, favoriler ve rezervasyon gibi temel işlevleri sağlar.

## Klasör ve Dosya Açıklamaları

- **Controllers/**
	- `AuthController.cs`: Kullanıcı kayıt, giriş, şifre sıfırlama ve e-posta işlemleri için endpointler.
	- `FavoritesController.cs`: Kullanıcıların favori ilanlarını ekleme, silme ve listeleme işlemleri için endpointler.
	- `ListingsController.cs`: İlanları listeleme, arama, detay görüntüleme işlemleri için endpointler.
	- `MyListingsController.cs`: Kullanıcıya ait ilanların yönetimi (ekleme, düzenleme, silme) için endpointler.
	- `UserController.cs`: Profil görüntüleme ve güncelleme işlemleri için endpointler.

- **Data/**
	- `AppDbContext.cs`: Entity Framework Core ile veritabanı bağlantısı ve tabloların tanımı.

- **DTOs/**
	- `AuthDTOs.cs`: Kimlik doğrulama işlemleri için veri transfer objeleri.
	- `ListingDTO.cs`: İlan işlemleri için veri transfer objeleri.

- **Models/**
	- `User.cs`: Kullanıcı modelinin özellikleri ve ilişkileri.
	- `Listings.cs`: İlan modelinin özellikleri ve ilişkileri.

- **Services/**
	- `EmailService.cs`: E-posta gönderme işlemlerini yöneten servis.

- **Migrations/**
	- Veritabanı migrasyon dosyaları. Tabloların ve ilişkilerin oluşturulma geçmişi.

- **appsettings.json / appsettings.Development.json**: Uygulama yapılandırma dosyaları (veritabanı bağlantı dizesi, e-posta ayarları vb).

- **StayinApi.csproj**: Proje bağımlılıkları ve yapılandırma dosyası.

## Önemli Endpointler

Aşağıda temel endpointler ve işlevleri listelenmiştir:

### AuthController
- `POST /api/auth/register` : Kullanıcı kaydı
- `POST /api/auth/login` : Kullanıcı girişi
- `POST /api/auth/forgot-password` : Şifre sıfırlama isteği
- `POST /api/auth/reset-password` : Şifreyi güncelleme

### ListingsController
- `GET /api/listings` : Tüm ilanları listele
- `GET /api/listings/{id}` : İlan detayını getir

### MyListingsController
- `GET /api/mylistings` : Kullanıcıya ait ilanları getir
- `POST /api/mylistings` : Yeni ilan ekle
- `PUT /api/mylistings/{id}` : İlanı güncelle
- `DELETE /api/mylistings/{id}` : İlanı sil

### FavoritesController
- `GET /api/favorites` : Favori ilanları getir
- `POST /api/favorites/{listingId}` : Favoriye ilan ekle
- `DELETE /api/favorites/{listingId}` : Favoriden ilan çıkar

### UserController
- `GET /api/user/profile` : Kullanıcı profilini getir
- `PUT /api/user/profile` : Profil bilgilerini güncelle

## Çalıştırma

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

## Notlar
- Tüm endpointler JWT tabanlı kimlik doğrulama ile korunmaktadır.
- Geliştirme ortamı ayarları için `appsettings.Development.json` dosyasını kullanın.

