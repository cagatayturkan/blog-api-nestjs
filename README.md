# Blog RESTful API Projesi (NestJS + TypeORM + PostgreSQL)

## Proje Özeti

Bu proje, NestJS framework'ü kullanılarak geliştirilmiş RESTful bir blog API'sidir. Temel amacı, blog yazılarını (post) yönetmek için CRUD (Create, Read, Update, Delete) operasyonlarını sunmaktır. Proje, PostgreSQL veritabanı ile entegre çalışmakta olup, veri erişimi için TypeORM kullanmaktadır. Ayrıca, API isteklerini sınırlama (rate limiting), standart bir yanıt formatı ve veritabanını başlangıç verileriyle doldurma (seeding) gibi özelliklere sahiptir.

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

*   `POST /api/v1/posts`: Yeni bir blog yazısı oluşturur.
*   `GET /api/v1/posts`: Tüm blog yazılarını sayfalama, sıralama ve filtreleme seçenekleriyle listeler.
*   `GET /api/v1/posts/:id`: Belirli bir ID'ye sahip yazıyı getirir.
*   `GET /api/v1/posts/:projectIdentifier/:slug`: Belirli bir `projectIdentifier` ve `slug` ile yazıyı getirir.
*   `PATCH /api/v1/posts/:id`: Belirli bir ID'ye sahip yazıyı günceller.
*   `DELETE /api/v1/posts/:id`: Belirli bir ID'ye sahip yazıyı siler.

## Kurulum ve Çalıştırma

1.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```
2.  **Veritabanı Kurulumu:**
    *   Bir PostgreSQL veritabanı oluşturun.
    *   `src/app.module.ts` içerisindeki `TypeOrmModule.forRootAsync` konfigürasyonunda veritabanı bağlantı bilgilerinizi (host, port, username, password, database name) güncelleyin. Bu bilgiler genellikle `.env` dosyası üzerinden yönetilir, ancak mevcut yapıda doğrudan konfigürasyonda yer almaktadır.
3.  **Uygulamayı Geliştirme Modunda Başlatın:**
    ```bash
    npm run start:dev
    ```
    Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır. API prefix ile birlikte `http://localhost:3000/api/v1` üzerinden erişilebilir.
4.  **Veritabanını Seed Edin (İsteğe Bağlı):**
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
