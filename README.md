# Blog RESTful API Projesi (NestJS + TypeORM + PostgreSQL)

## Proje Özeti

Bu proje, NestJS framework'ü kullanılarak geliştirilmiş RESTful bir blog API'sidir. Temel amacı, blog yazılarını (post) yönetmek için CRUD (Create, Read, Update, Delete) operasyonlarını sunmaktır. Proje, PostgreSQL veritabanı ile entegre çalışmakta olup, veri erişimi için TypeORM kullanmaktadır. Gelişmiş kimlik doğrulama (Authentication) ve yetkilendirme (Authorization) mekanizmalarına sahiptir; e-posta/şifre ile kayıt ve girişin yanı sıra Google OAuth 2.0 ile sosyal giriş imkanı sunar. JWT (JSON Web Tokens) tabanlı bir yetkilendirme sistemi kullanılarak korumalı endpoint'lere erişim yönetilir. Ayrıca, API isteklerini sınırlama (rate limiting), standart bir yanıt formatı ve veritabanını başlangıç verileriyle doldurma (seeding) gibi özelliklere sahiptir.

Projenin temel gereksinimlerinden biri, yazıların bir "proje tanımlayıcısı" (`projectIdentifier`) ve "kısa ad" (`slug`) kombinasyonu ile benzersiz bir şekilde adreslenebilmesidir. Bu, farklı projeler veya siteler altında benzer içeriklerin yönetilebilmesine olanak tanır.

## Temel Özellikler

*   **RESTful API:** Blog yazıları için standart HTTP metotları ile CRUD işlemleri.
*   **Veritabanı:** PostgreSQL.
*   **ORM:** TypeORM ile veritabanı etkileşimi ve entity yönetimi.
*   **TypeScript:** Güçlü tipleme ile geliştirme.
*   **NestJS Framework:** Modüler ve ölçeklenebilir backend yapısı.
*   **Veri Doğrulama (Validation):** `class-validator` ve `class-transformer` ile DTO (Data Transfer Object) bazlı giriş verisi doğrulaması.
*   **Standart Yanıt Formatı:** Tüm API yanıtları `{ status: "SUCCESS" | "FAILED", message?: string, data?: any, pagination?: any }` formatında döner. (Bkz. `ResponseInterceptor`)
*   **Sayfalama (Pagination):** Yazı listeleme endpoint'lerinde sayfalama desteği.
*   **Sıralama (Sorting):** Yazı listeleme endpoint'lerinde çeşitli alanlara göre sıralama.
*   **Filtreleme:** Proje tanımlayıcısı (`projectIdentifier`), dil (`language`), başlıkta arama (`searchTerm`) gibi kriterlere göre filtreleme.
*   **Rate Limiting:** `@nestjs/throttler` ile API isteklerini sınırlama (varsayılan olarak 60 saniyede 10 istek).
*   **Veritabanı Seeding:** `mock.json` dosyasındaki verilerle veritabanını başlangıç için doldurma script'i.
*   **Konfigürasyon:** Global API prefix (`/api/v1`), global pipes ve interceptor'lar.
*   **Postman Koleksiyonu:** API endpoint'lerini test etmek için `postman.json` dosyası.

## Kullanılan Teknolojiler

*   **Backend Framework:** NestJS (Node.js)
*   **Dil:** TypeScript
*   **Veritabanı:** PostgreSQL
*   **ORM:** TypeORM
*   **API İstek Sınırlama:** `@nestjs/throttler`
*   **Veri Doğrulama:** `class-validator`, `class-transformer`
*   **Paket Yöneticisi:** npm

## Proje Yapısı ve Dosya Sorumlulukları

```
.
├── mock.json                 # Veritabanı seeding için kullanılan örnek blog yazısı verileri
├── node_modules/             # Proje bağımlılıkları
├── postman.json              # API testleri için Postman koleksiyonu
├── src/
│   ├── app.controller.spec.ts# AppController için birim testleri (temel)
│   ├── app.controller.ts     # Ana uygulama controller'ı (örn: veritabanı bağlantı kontrolü için /db-check)
│   ├── app.module.ts         # Ana uygulama modülü (root module). TypeORM, ThrottlerModule gibi global modülleri ve konfigürasyonları içerir.
│   ├── app.service.ts        # Ana uygulama servisi
│   ├── common/
│   │   └── interceptors/
│   │       └── response.interceptor.ts # Tüm API yanıtlarını standart bir formata dönüştüren global interceptor.
│   ├── db/
│   │   └── seed.ts           # mock.json'dan verileri alıp veritabanına yazan seeding script'i.
│   ├── main.ts               # Uygulamanın giriş noktası (entry point). Global prefix, ValidationPipe, ResponseInterceptor gibi ayarları yapar.
│   └── posts/                # Blog yazıları (posts) ile ilgili tüm mantığı içeren modül.
│       ├── dto/              # Data Transfer Object'ler. API istek gövdelerini tanımlar ve doğrulama kuralları içerir.
│       │   ├── content-block.dto.ts
│       │   ├── create-post.dto.ts
│       │   ├── seo-data.dto.ts
│       │   └── update-post.dto.ts
│       ├── entities/
│       │   └── post.entity.ts# TypeORM entity'si. 'posts' tablosunun yapısını ve ilişkilerini tanımlar.
│       ├── interfaces/
│       │   └── post.interface.ts # Post verisi için TypeScript arayüzleri (Post, ContentBlock, SeoData).
│       ├── posts.controller.ts # HTTP isteklerini karşılar, DTO'ları doğrular ve PostsService'i çağırır.
│       ├── posts.module.ts     # PostsController, PostsService ve PostEntity'yi bir araya getiren modül. TypeOrmModule.forFeature() ile PostEntity'yi tanımlar.
│       └── posts.service.ts    # Tüm iş mantığını (business logic) içerir. Veritabanı işlemleri (CRUD), DTO ve Entity arası dönüşümler burada yapılır.
├── test/                     # E2E testleri için klasör
├── .eslintrc.js              # ESLint konfigürasyonu
├── .gitignore                # Git tarafından takip edilmeyecek dosyalar
├── .prettierrc               # Prettier kod formatlama ayarları
├── nest-cli.json             # NestJS CLI konfigürasyonu
├── package-lock.json         # Bağımlılıkların kilitli versiyonları
├── package.json              # Proje bağımlılıkları ve script'leri (npm start, npm run seed vb.)
├── README.md                 # Bu dosya - proje hakkında genel bilgiler
└── tsconfig.json             # TypeScript derleyici ayarları
```

### Ana Dosyalar ve Sorumlulukları:

*   **`src/main.ts`**: Uygulamanın başladığı yerdir. NestJS uygulamasını oluşturur, global ayarları (API prefix `/api/v1`, `ValidationPipe`, `ResponseInterceptor`) uygular ve belirtilen portu dinlemeye başlar.
*   **`src/app.module.ts`**: Projenin kök modülüdür. Diğer modülleri (`PostsModule`), veritabanı bağlantısını (`TypeOrmModule.forRootAsync`), istek sınırlama modülünü (`ThrottlerModule.forRoot`) ve diğer genel yapılandırmaları içerir.
*   **`src/posts/posts.module.ts`**: Blog yazılarıyla ilgili tüm bileşenleri (controller, service, entity) bir araya getiren özelleşmiş modüldür. `TypeOrmModule.forFeature([PostEntity])` ile bu modülün `PostEntity`'yi kullanacağını belirtir.
*   **`src/posts/posts.controller.ts`**: `/posts` altındaki HTTP endpoint'lerini yönetir. Gelen istekleri alır, `ValidationPipe` sayesinde DTO'lar aracılığıyla verileri doğrular, ilgili `PostsService` metodunu çağırır ve sonucu `ResponseInterceptor` aracılığıyla formatlayarak döner.
*   **`src/posts/posts.service.ts`**: Asıl iş mantığının bulunduğu yerdir. Veritabanı işlemleri (yazı oluşturma, bulma, güncelleme, silme), `CreatePostDto` ve `UpdatePostDto` gibi DTO'lardan `PostEntity`'ye ve `PostEntity`'den `PostInterface` gibi arayüzlere veri dönüşümleri burada gerçekleştirilir.
*   **`src/posts/entities/post.entity.ts`**: `PostEntity` sınıfı, TypeORM tarafından `posts` veritabanı tablosunu temsil etmek için kullanılır. Kolonlar, ilişkiler, birincil anahtar (`id`), otomatik oluşturulan tarihler (`created_at`, `updated_at`) ve benzersiz kısıtlamalar (`project_identifier` ve `slug` kombinasyonu) burada tanımlanır.
*   **`src/common/interceptors/response.interceptor.ts`**: Global bir interceptor olup, tüm başarılı API yanıtlarını ve hataları standart bir JSON formatına sokar. Başarılı yanıtlarda `data` alanını, paginasyonlu yanıtlarda `data` ve `pagination` alanlarını doldurur. Hatalarda ise `status: "FAILED"` ve `message` ile birlikte orijinal HTTP hata kodunu korur.
*   **`src/db/seed.ts`**: `mock.json` dosyasındaki verileri kullanarak veritabanına başlangıç yazıları eklemek için kullanılan bir script'tir. `PostsService` üzerinden çalışır ve mevcut kayıtları kontrol ederek mükerrerliği önler.

## API Endpoint'leri

API endpoint'lerinin detaylı listesi ve test istekleri için lütfen projeyle birlikte sunulan `postman.json` dosyasını Postman uygulamasında import ediniz. Temel endpoint'ler:

**Blog Yazıları (Posts):**

*   `POST /api/v1/posts`: Yeni bir blog yazısı oluşturur. (Kimlik Doğrulama Gerekli)
*   `GET /api/v1/posts`: Tüm blog yazılarını sayfalama, sıralama ve filtreleme seçenekleriyle listeler. (Herkese Açık)
*   `GET /api/v1/posts/:id`: Belirli bir ID'ye sahip yazıyı getirir. (Herkese Açık)
*   `GET /api/v1/posts/:projectIdentifier/:slug`: Belirli bir `projectIdentifier` ve `slug` ile yazıyı getirir. (Herkese Açık)
*   `PATCH /api/v1/posts/:id`: Belirli bir ID'ye sahip yazıyı günceller. (Kimlik Doğrulama Gerekli)
*   `DELETE /api/v1/posts/:id`: Belirli bir ID'ye sahip yazıyı siler. (Kimlik Doğrulama Gerekli)

**Kimlik Doğrulama (Authentication):**

*   `POST /api/v1/auth/register`: Yeni kullanıcı kaydı (e-posta, isim, soyisim, şifre).
*   `POST /api/v1/auth/login`: E-posta ve şifre ile kullanıcı girişi (JWT döndürür).
*   `GET /api/v1/auth/google`: Google ile kimlik doğrulama akışını başlatır.
*   `GET /api/v1/auth/google/callback`: Google kimlik doğrulaması sonrası geri çağrı URL'si (JWT döndürür ve ön yüze yönlendirir).
*   `GET /api/v1/auth/profile`: Giriş yapmış kullanıcının profil bilgilerini getirir. (Kimlik Doğrulama Gerekli)
*   `GET /api/v1/auth/users/:id`: Belirli bir ID'ye sahip kullanıcının profil bilgilerini getirir. (Kimlik Doğrulama Gerekli)
*   `PUT /api/v1/auth/users/:id`: Belirli bir ID'ye sahip kullanıcının profil bilgilerini günceller. (Sadece kendi profilini güncelleyebilir, Kimlik Doğrulama Gerekli)
*   `DELETE /api/v1/auth/users/:id`: Belirli bir ID'ye sahip kullanıcıyı siler. (Sadece kendi profilini silebilir, Kimlik Doğrulama Gerekli)

## Kurulum ve Çalıştırma

1.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```
2.  **Ortam Değişkenlerini Ayarlayın:**
    *   Proje kök dizininde `env-sample` dosyasını `.env` olarak kopyalayın.
    *   `.env` dosyasını kendi PostgreSQL veritabanı bilgileriniz (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`), JWT ayarlarınız (`JWT_SECRET`, `JWT_EXPIRES_IN`) ve Google OAuth 2.0 istemci bilgileriniz (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`) ile güncelleyin.
3.  **Veritabanı Kurulumu:**
    *   Bir PostgreSQL veritabanı oluşturun (eğer `.env` dosyasında belirttiğiniz veritabanı mevcut değilse).
4.  **Uygulamayı Geliştirme Modunda Başlatın:**
    ```bash
    npm run start:dev
    ```
    Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır (`.env` dosyasındaki `PORT` değerine göre). API prefix ile birlikte `http://localhost:3000/api/v1` (`.env` dosyasındaki `API_PREFIX` değerine göre) üzerinden erişilebilir.
5.  **Veritabanını Seed Edin (İsteğe Bağlı):**
    `mock.json` dosyasındaki verilerle veritabanını doldurmak için:
    ```bash
    npm run seed
    ```
    Bu komut, `src/db/seed.ts` script'ini çalıştırır.

## Veritabanı Bağlantısı

Veritabanı bağlantısı `src/app.module.ts` dosyasında `TypeOrmModule.forRootAsync` kullanılarak yapılandırılır. PostgreSQL bağlantı detayları burada belirtilir ve `synchronize: true` ayarı sayesinde (geliştirme ortamında) entity tanımlarınızdaki değişiklikler veritabanı şemasına otomatik olarak yansıtılır. Produktif ortamlar için `synchronize: true` yerine migration'lar kullanılması önerilir.

## İstek Yaşam Döngüsü (Request Lifecycle)

1.  İstemciden (client) gelen HTTP isteği NestJS uygulamasına ulaşır.
2.  `main.ts`'de tanımlanan global prefix (`/api/v1`) uygulanır.
3.  `AppModule`'de tanımlanan `ThrottlerModule` (rate limiter) gelen isteği kontrol eder. Sınırı aşarsa istek reddedilir.
4.  İstek, tanımlanan route'a göre ilgili Controller'a yönlendirilir (örn: `PostsController`).
5.  Eğer Controller metodu bir DTO bekliyorsa ve `main.ts`'de global `ValidationPipe` tanımlıysa, gelen istek gövdesi (body) DTO'ya göre doğrulanır. Doğrulama başarısız olursa hata döner.
6.  Controller metodu çalışır ve genellikle ilgili Service metodunu çağırır (örn: `PostsService.create(createPostDto)`).
7.  Service metodu iş mantığını yürütür. Bu, TypeORM aracılığıyla veritabanı ile etkileşim (veri okuma/yazma), veri dönüşümleri veya diğer hesaplamaları içerebilir.
8.  Service, sonucu (veri veya hata) Controller'a döndürür.
9.  `main.ts`'de global olarak tanımlanan `ResponseInterceptor`, Controller'dan dönen sonucu alır.
    *   Başarılı ise, standart `{ status: "SUCCESS", data: ... }` formatına dönüştürür.
    *   Hata ise, standart `{ status: "FAILED", message: ... }` formatına dönüştürür ve orijinal HTTP hata kodunu korur.
10. Formatlanmış yanıt istemciye geri gönderilir.

## Önemli Mimari Kararlar

*   **Global Response Interceptor:** Tüm API yanıtlarının tutarlı bir formatta olmasını sağlar. Bu, frontend entegrasyonunu kolaylaştırır.
*   **TypeORM ile Entity Yönetimi:** `PostEntity` gibi sınıflar aracılığıyla veritabanı şeması kod üzerinden yönetilir. `project_identifier` ve `slug` üzerinden benzersizlik, doğrudan entity tanımında belirtilmiştir.
*   **DTO ile Veri Doğrulama:** API'ye gelen verilerin doğruluğu ve bütünlüğü `class-validator` dekoratörleri ile DTO katmanında sağlanır. Bu, service katmanına temiz veri akışını garanti eder.
*   **Modüler Yapı:** NestJS'in modüler yapısı sayesinde `PostsModule` gibi özellik bazlı modüller oluşturularak kod organizasyonu ve yönetimi kolaylaştırılmıştır.
*   **Seeding Script:** Geliştirme ve test süreçlerini hızlandırmak için `mock.json` verileriyle veritabanını kolayca doldurabilme imkanı sunar.

## Kimlik Doğrulama ve Yetkilendirme (Authentication & Authorization)

Proje, kapsamlı bir kimlik doğrulama ve yetkilendirme sistemi içerir.

### 1. E-posta/Şifre ile Kayıt ve Giriş

*   **Kayıt (`POST /auth/register`):**
    *   Kullanıcılar `email`, `firstName`, `lastName` ve `password` bilgileriyle sisteme kaydolabilir.
    *   Giriş verileri `RegisterDto` kullanılarak doğrulanır.
    *   Şifreler, `UserEntity` içinde `@BeforeInsert` hook'u ile `bcrypt` kullanılarak hashlenir ve veritabanına güvenli bir şekilde saklanır.
    *   Başarılı kayıtta, şifre hariç kullanıcı bilgileri döndürülür.
*   **Giriş (`POST /auth/login`):**
    *   Kullanıcılar `email` ve `password` ile giriş yapar.
    *   Giriş verileri `LoginDto` ile doğrulanır.
    *   `UserEntity.validatePassword()` metodu (bcrypt.compare) ile şifre doğrulaması yapılır.
    *   Başarılı girişte, kullanıcının `id` ve `email` bilgilerini içeren bir JWT (JSON Web Token) oluşturulur. Bu token, `.env` dosyasındaki `JWT_SECRET` ile imzalanır ve `JWT_EXPIRES_IN` süresi boyunca geçerlidir.
    *   Yanıt olarak `access_token` (JWT) ve kullanıcı bilgileri (şifre hariç) döndürülür.

### 2. Google ile Kimlik Doğrulama (OAuth 2.0)

*   **Akış Başlatma (`GET /auth/google`):**
    *   Bu endpoint, kullanıcıyı Google'ın kimlik doğrulama sayfasına yönlendirir.
    *   `GoogleStrategy` (`src/auth/strategies/google.strategy.ts`) bu süreci yönetir.
*   **Strateji Yapılandırması:**
    *   `GoogleStrategy`, `.env` dosyasından alınan `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ve `GOOGLE_CALLBACK_URL` ile yapılandırılır.
    *   Google'dan `email` ve `profile` kapsamlarını talep eder.
*   **Geri Çağrı (`GET /auth/google/callback`):**
    *   Kullanıcı Google'da başarıyla kimliğini doğruladıktan sonra, Google bu callback URL'sine yönlendirir.
    *   `GoogleStrategy.validate()` metodu, Google'dan gelen profil bilgilerini (isim, e-posta, resim, Google ID) alır ve `req.user` objesine ekler.
    *   `AuthService.googleLogin()` metodu çağrılır:
        *   **Yeni Kullanıcı:** Eğer Google e-postası ile sistemde kayıtlı bir kullanıcı yoksa, yeni bir kullanıcı (`UserEntity`) oluşturulur. `google_id` ve `picture` alanları Google profilinden doldurulur, `is_email_verified` `true` olarak ayarlanır.
        *   **Mevcut Kullanıcı:** Eğer e-posta ile kayıtlı bir kullanıcı varsa, `google_id` bilgisi güncellenir ve `is_email_verified` `true` yapılır. Gerekirse profil resmi de güncellenir.
        *   Her iki durumda da kullanıcı için bir JWT oluşturulur.
    *   Son olarak, kullanıcı `.env` dosyasındaki `FRONTEND_URL` adresine, sorgu parametresinde `access_token` (JWT) ile birlikte yönlendirilir.

### 3. JWT ile Yetkilendirme

*   Giriş yapan kullanıcılar (e-posta/şifre veya Google ile), aldıkları JWT'yi korumalı endpoint'lere yapacakları isteklerde `Authorization: Bearer <token>` başlığında göndermelidir.
*   `JwtStrategy` (`src/auth/strategies/jwt.strategy.ts`), bu token'ı doğrular ve içindeki kullanıcı bilgilerini (`id`, `email`) `req.user` objesine ekler.
*   `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`), `@UseGuards(JwtAuthGuard)` ile işaretlenmiş endpoint'leri korur. Sadece geçerli bir JWT'ye sahip kullanıcılar bu endpoint'lere erişebilir.
*   **Korumalı Endpoint'ler Örnekleri:**
    *   `POST /posts`, `PATCH /posts/:id`, `DELETE /posts/:id` (Yazı oluşturma, güncelleme, silme)
    *   `GET /auth/profile` (Kendi profilini görme)
    *   `GET /auth/users/:id` (Başka bir kullanıcının profilini görme)
    *   `PUT /auth/users/:id` (Kendi profilini güncelleme)
    *   `DELETE /auth/users/:id` (Kendi profilini silme)

### 4. Kullanıcı Varlığı (`UserEntity`)

*   `src/auth/entities/user.entity.ts` dosyasındaki `UserEntity`, kullanıcı bilgilerini (`id`, `email`, `first_name`, `last_name`, `password` (hashlenmiş), `google_id`, `picture`, `is_email_verified`) `users` tablosunda saklar.
*   `password` alanı, Google ile kaydolan kullanıcılar için `null` olabilir.
*   `is_email_verified` alanı, e-posta doğrulama süreçleri için bir temel sağlar (Google ile kayıtta otomatik `true`).

### 5. Güvenlik ve Yapılandırma

*   Tüm hassas bilgiler (`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` vb.) `.env` dosyasında saklanır ve `ConfigService` aracılığıyla uygulamada kullanılır.
*   Şifreler asla düz metin olarak saklanmaz, her zaman `bcrypt` ile hashlenir.
*   İstek sınırlaması (`ThrottlerModule`) genel olarak ve özellikle `AuthModule` için daha sıkı kurallarla yapılandırılmıştır.
