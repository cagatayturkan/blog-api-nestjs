# 🚀 Blog REST API

Modern, güvenli ve ölçeklenebilir Blog REST API. NestJS, TypeORM ve PostgreSQL ile geliştirilmiştir.

## ✨ Özellikler

### 🔐 Gelişmiş JWT Session Management
- **Token Blacklist Sistemi** - Logout edilen token'ların geçersiz kılınması
- **Multi-Device Logout** - Tüm cihazlardan çıkış yapabilme
- **Güvenli Şifre Değişikliği** - Session invalidation ile
- **Refresh Token Rotation** - Güvenlik için token yenileme
- **Otomatik Token Cleanup** - Expired token'ların temizlenmesi

### 👥 Kullanıcı Yönetimi
- Kullanıcı kaydı ve girişi
- Role-based access control (SUPER_ADMIN, USER, READ_ONLY)
- Google OAuth entegrasyonu
- Profil yönetimi
- Kullanıcı CRUD işlemleri

### 📝 Blog Yönetimi
- Blog yazısı CRUD işlemleri
- Kategori yönetimi
- Slug-based URL'ler
- Yayın durumu kontrolü
- Yazar atama sistemi

### 🏗️ Proje Yönetimi
- Proje oluşturma ve yönetimi
- Kullanıcı-proje ilişkilendirme
- Proje bazlı yetkilendirme

### 🛡️ Güvenlik
- JWT Authentication
- Role-based authorization
- Input validation
- SQL injection koruması
- Rate limiting
- CORS yapılandırması

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 13+
- npm veya yarn

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd blog-restful-api
```

### 2. Bağımlılıkları Yükleyin
    ```bash
    npm install
    ```

### 3. Environment Dosyasını Oluşturun
```bash
cp .env.example .env
```

### 4. Environment Değişkenlerini Ayarlayın
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=blog_db

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth (Opsiyonel)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server
PORT=3000
NODE_ENV=development

# 📧 Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Blog API
```

### 5. Veritabanını Oluşturun
    ```bash
# PostgreSQL'de veritabanı oluşturun
createdb blog_db
```

### 6. Uygulamayı Başlatın
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📚 API Dokümantasyonu

### Swagger UI
Uygulama çalıştıktan sonra Swagger dokümantasyonuna erişebilirsiniz:
- **URL**: http://localhost:3000/api/docs
- Tüm endpoint'lerin detaylı dokümantasyonu
- Interactive API testing
- Authentication support

### Postman Collection
Hazır test collection'ları:
- `Blog-API.postman_collection.json` - Tüm endpoint'ler
- `Blog-API.postman_environment.json` - Environment değişkenleri

### Test Senaryoları
Detaylı test rehberi:
- `TEST_SCENARIOS.md` - Adım adım test senaryoları

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Kullanıcı kaydı
- `POST /api/v1/auth/login` - Kullanıcı girişi
- `POST /api/v1/auth/refresh` - Token yenileme
- `POST /api/v1/auth/logout` - Çıkış (tek cihaz)
- `POST /api/v1/auth/logout-all-devices` - Tüm cihazlardan çıkış
- `POST /api/v1/auth/change-password` - Şifre değişikliği (authenticated)
- `POST /api/v1/auth/reset-password` - Şifre sıfırlama (public)
- `GET /api/v1/auth/profile` - Profil bilgileri

### User Management
- `GET /api/v1/auth/users` - Tüm kullanıcılar (Admin)
- `GET /api/v1/auth/users/:id` - Kullanıcı detayı
- `PUT /api/v1/auth/users/:id` - Kullanıcı güncelleme
- `PATCH /api/v1/auth/users/:id/role` - Rol güncelleme
- `DELETE /api/v1/auth/users/:id` - Kullanıcı silme

### Blog Posts
- `GET /api/v1/posts` - Tüm yazılar
- `GET /api/v1/posts/:id` - Yazı detayı
- `GET /api/v1/posts/slug/:slug` - Slug ile yazı
- `POST /api/v1/posts` - Yeni yazı
- `PATCH /api/v1/posts/:id` - Yazı güncelleme
- `DELETE /api/v1/posts/:id` - Yazı silme

### Categories
- `GET /api/v1/categories` - Tüm kategoriler
- `GET /api/v1/categories/:id` - Kategori detayı
- `POST /api/v1/categories` - Yeni kategori
- `PATCH /api/v1/categories/:id` - Kategori güncelleme
- `DELETE /api/v1/categories/:id` - Kategori silme

### Projects
- `GET /api/v1/projects` - Tüm projeler

### User-Projects
- `POST /api/v1/user-projects/assign` - Kullanıcı-proje atama
- `GET /api/v1/user-projects/user/:userId/projects` - Kullanıcının projeleri
- `GET /api/v1/user-projects` - Tüm ilişkiler

## 🧪 Testing

### Postman ile Test
1. Collection ve environment dosyalarını import edin
2. `TEST_SCENARIOS.md` dosyasındaki adımları takip edin
3. Otomatik environment variable set'leme özelliğini kullanın

### Manuel Test
```bash
# Server'ı başlatın
npm run start:dev

# Test endpoint'i
curl http://localhost:3000/api/v1

# Admin login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@blog.com", "password": "final_password456"}'
```

## 🏗️ Proje Yapısı

```
src/
├── auth/                 # Authentication modülü
│   ├── controllers/      # Auth controller
│   ├── services/         # Auth service
│   ├── entities/         # User entity
│   ├── dto/             # Data transfer objects
│   ├── guards/          # JWT guards
│   ├── strategies/      # Passport strategies
│   └── enums/           # User roles
├── posts/               # Blog posts modülü
├── categories/          # Categories modülü
├── projects/            # Projects modülü
├── user-projects/       # User-project relations
├── token-blacklist/     # Token blacklist sistemi
└── common/              # Ortak utilities
```

## 🔧 Geliştirme

### Scripts
```bash
npm run start:dev      # Development mode
npm run start:debug    # Debug mode
npm run start:prod     # Production mode
npm run build          # Build project
npm run lint           # Lint check
npm run lint:fix       # Fix lint issues
npm run test           # Run tests
npm run test:watch     # Watch mode tests
npm run test:e2e       # End-to-end tests
```

### Database Migrations
    ```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
```

## 🚀 Production Deployment

### Environment Variables
Production için gerekli environment değişkenleri:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=very_secure_secret
REFRESH_TOKEN_SECRET=very_secure_refresh_secret
```

### Docker (Opsiyonel)
```bash
# Docker image build
docker build -t blog-api .

# Container'ı çalıştır
docker run -p 3000:3000 blog-api
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için issue açabilir veya email gönderebilirsiniz.

---

**Not**: Bu API development aşamasındadır. Production kullanımı için ek güvenlik önlemleri alınması önerilir.
