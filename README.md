# SkillNusa - Platform Freelancer Indonesia

SkillNusa adalah platform yang menghubungkan freelancer dengan klien di Indonesia. Platform ini memungkinkan freelancer untuk menawarkan jasa mereka dan klien untuk mencari talent yang sesuai dengan kebutuhan proyek mereka.

## Fitur Utama

### Untuk Freelancer
- **Profil Profesional**: Buat profil yang menarik dengan portfolio, skill, dan pengalaman
- **Pencarian Proyek**: Temukan proyek yang sesuai dengan keahlian Anda
- **Proposal Otomatis**: Kirim proposal dengan template yang dapat disesuaikan
- **Manajemen Proyek**: Kelola proyek aktif dan riwayat pekerjaan
- **Rating & Review**: Bangun reputasi melalui sistem rating dari klien

### Untuk Klien
- **Posting Proyek**: Buat posting proyek dengan detail yang jelas
- **Pencarian Freelancer**: Cari freelancer berdasarkan skill, rating, dan lokasi
- **Manajemen Proposal**: Review dan kelola proposal yang masuk
- **Sistem Pembayaran**: Proses pembayaran yang aman dan terpercaya
- **Tracking Progress**: Pantau progress proyek secara real-time

### Fitur Umum
- **Multi-Role Support**: Pengguna dapat berperan sebagai freelancer dan klien
- **Real-time Chat**: Komunikasi langsung antara freelancer dan klien
- **Notifikasi**: Update real-time untuk aktivitas penting
- **Analytics**: Statistik dan insights untuk performa
- **Mobile Responsive**: Akses dari berbagai perangkat

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** - Library UI modern
- **React Router v6** - Routing dan navigasi
- **Tailwind CSS** - Styling dan design system
- **React Hook Form** - Form management
- **React Query** - State management dan caching

### Backend & Database
- **Firebase Authentication** - Sistem autentikasi
- **Cloud Firestore** - Database NoSQL
- **Firebase Storage** - Penyimpanan file
- **Firebase Functions** - Serverless functions

### Tools & Services
- **Cloudinary** - Image optimization dan CDN
- **Vite** - Build tool dan development server
- **ESLint & Prettier** - Code quality dan formatting

## Instalasi

### Prerequisites
- Node.js (v16 atau lebih baru)
- npm atau yarn
- Git

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/skillnusa.git
   cd skillnusa
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Isi file `.env` dengan konfigurasi Firebase dan Cloudinary:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_API_KEY=your_api_key
   VITE_CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

5. **Buka browser**
   Akses `http://localhost:5173` untuk melihat aplikasi

## 🏗️ Struktur Proyek

```
src/
├── components/          # Komponen React reusable
│   ├── Auth/           # Komponen autentikasi
│   ├── Layout/         # Layout komponen
│   ├── Profile/        # Komponen profil
│   ├── Project/        # Komponen proyek
│   ├── UI/             # UI komponen dasar
│   └── common/         # Komponen umum
├── context/            # React Context providers
├── firebase/           # Konfigurasi Firebase
├── hooks/              # Custom React hooks
├── pages/              # Halaman aplikasi
├── repositories/       # Data access layer
├── routes/             # Konfigurasi routing
├── services/           # Business logic layer
├── utils/              # Utility functions
└── validation/         # Skema validasi
```

## 🔧 Arsitektur & Patterns

### Service Layer Pattern
Aplikasi menggunakan service layer pattern untuk memisahkan business logic dari UI components:

```javascript
// BaseService - Kelas dasar untuk semua service
class BaseService {
  async handleOperation(operation, operationName, context) {
    return ErrorHandler.handleAsync(operation, operationName, context);
  }
}

// UserService - Extends BaseService
class UserService extends BaseService {
  async getUserById(userId) {
    return this.handleOperation(
      () => this.repository.findById(userId),
      'getUserById',
      { userId }
    );
  }
}
```

### Error Handling System
Sistem error handling yang komprehensif dengan custom error classes:

```javascript
// Custom error classes
export class ValidationError extends AppError {
  constructor(message, code, field) {
    super(message, code, 400);
    this.field = field;
  }
}

// Error handler utility
export class ErrorHandler {
  static handleServiceError(error, operation, context) {
    Logger.operationFailed(operation, error);
    // Return user-friendly error messages
  }
}
```

### Logging System
Unified logging system dengan environment-aware output:

```javascript
class Logger {
  static error(message, error, context) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, { error, context, timestamp });
    }
  }
}
```

### Validation System
Comprehensive validation dengan reusable schemas:

```javascript
export const validationSchemas = {
  userRegistration: {
    email: validateEmail,
    password: validatePassword,
    username: validateUsername
  }
};

export const validateSchema = (data, schema) => {
  // Validate data against schema and return results
};
```

## Testing

### Setup Testing Environment
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Test Utilities
Aplikasi menyediakan test helpers untuk mempermudah testing:

```javascript
import { renderWithProviders, mockUsers, generateTestData } from './utils/testHelpers';

// Render component with providers
const { getByText } = renderWithProviders(<MyComponent />);

// Use mock data
const testUser = generateTestData.user({ role: 'freelancer' });
```

## 🔧 Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run preview` - Preview build production
- `npm run lint` - Menjalankan ESLint
- `npm run lint:fix` - Fix ESLint errors otomatis
- `npm run test` - Menjalankan unit tests
- `npm run test:coverage` - Test coverage report

## Deployment

### Vercel (Recommended)
1. Push code ke GitHub
2. Connect repository di Vercel
3. Set environment variables
4. Deploy otomatis

### Netlify
1. Build aplikasi: `npm run build`
2. Upload folder `dist` ke Netlify
3. Set environment variables
4. Configure redirects untuk SPA

## 🔒 Security Best Practices

### Authentication & Authorization
- JWT token validation
- Role-based access control (RBAC)
- Protected routes dengan guards
- Session management

### Data Validation
- Input sanitization
- Schema validation
- File upload restrictions
- XSS protection

### Firebase Security Rules
```javascript
// Firestore security rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📊 Performance Optimization

### Code Splitting
```javascript
// Lazy loading components
const Profile = lazy(() => import('./pages/Profile'));
const Browse = lazy(() => import('./pages/Browse'));
```

### Image Optimization
- Cloudinary integration untuk image processing
- Lazy loading untuk images
- WebP format support
- Responsive images

### Caching Strategy
- Service worker untuk offline support
- React Query untuk data caching
- Browser caching headers
- CDN untuk static assets

## Kontribusi

Kami menyambut kontribusi dari komunitas! Silakan ikuti langkah berikut:

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Guidelines Kontribusi
- Ikuti coding standards yang ada
- Tulis tests untuk fitur baru
- Update dokumentasi jika diperlukan
- Gunakan commit message yang deskriptif
- Follow the established architecture patterns

### Code Style
```javascript
// Use consistent naming conventions
const getUserProfile = async (userId) => {
  // Use proper error handling
  return ErrorHandler.handleAsync(
    () => userService.getUserProfile(userId),
    'getUserProfile',
    { userId }
  );
};
```

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

- **Email**: support@skillnusa.com
- **Website**: https://skillnusa.com
- **GitHub**: https://github.com/yourusername/skillnusa

## Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudinary](https://cloudinary.com/)
- [Vite](https://vitejs.dev/)

## Roadmap

### Q1 2024
- [ ] Advanced search filters
- [ ] Real-time notifications
- [ ] Mobile app development
- [ ] Payment gateway integration

### Q2 2024
- [ ] AI-powered project matching
- [ ] Video call integration
- [ ] Advanced reporting features
- [ ] Multi-language support

### Q3 2024
- [ ] API for third-party integrations
- [ ] Advanced project management tools
- [ ] Freelancer certification system
- [ ] Enterprise features
