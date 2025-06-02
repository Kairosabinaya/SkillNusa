# Freelancer Rating System Update

## Overview
Sistem rating freelancer telah diperbarui untuk menghitung rating berdasarkan rata-rata dari semua rating gigs yang dimiliki oleh freelancer tersebut, dan menghitung total ulasan berdasarkan SUM dari semua reviews yang diberikan kepada gigs freelancer.

## Changes Made

### 1. New FreelancerRatingService (`src/services/freelancerRatingService.js`)
Service baru yang menghitung rating freelancer secara dinamis:

**Key Features:**
- `calculateFreelancerRatingStats(freelancerId)`: Menghitung rata-rata rating dari semua gigs freelancer
- `getAllFreelancerReviews(freelancerId, options)`: Mengambil semua review dari semua gigs freelancer
- `updateFreelancerRatingInProfile(freelancerId)`: Update rating di profile freelancer

**Rating Calculation Logic:**
- Mengambil semua gigs aktif milik freelancer
- Untuk setiap gig, menghitung rating stats menggunakan `reviewService.getGigRatingStats()`
- Menghitung weighted average berdasarkan jumlah review per gig
- Formula: `totalRatingSum = Σ(gigRating × gigReviewCount)` / `totalReviewsCount`

### 2. Updated GigService (`src/services/gigService.js`)
**Changes:**
- Import `freelancerRatingService`
- Update `getFreelancerData()` function untuk menggunakan calculated rating:
  ```javascript
  const ratingStats = await freelancerRatingService.calculateFreelancerRatingStats(freelancerId);
  return {
    // ...other data
    rating: ratingStats.averageRating, // Use calculated rating
    totalReviews: ratingStats.totalReviews, // Use calculated total reviews
  };
  ```

### 3. Updated FreelancerProfile Page (`src/pages/FreelancerProfile.js`)
**Changes:**
- Import `freelancerRatingService`
- Update `loadFreelancerData()` untuk menggunakan service baru:
  - Menghitung rating stats menggunakan `calculateFreelancerRatingStats()`
  - Mengambil semua reviews menggunakan `getAllFreelancerReviews()`
  - Merge calculated rating dengan profile data

### 4. Updated FreelancerDashboard (`src/pages/Dashboard/FreelancerDashboard.js`)
**Changes:**
- Import `freelancerRatingService`
- Replace manual review calculation dengan service call:
  ```javascript
  const ratingStats = await freelancerRatingService.calculateFreelancerRatingStats(currentUser.uid);
  const averageRating = ratingStats.averageRating;
  const totalReviews = ratingStats.totalReviews;
  ```

### 5. Updated GigDetail Page (`src/pages/GigDetail.js`)
**Changes:**
- Improved date formatting untuk handle berbagai format tanggal
- Reviews sudah menggunakan data dari collection Reviews (via gigService.getGigById)

### 6. New Update Script (`src/scripts/updateFreelancerRatings.js`)
Script untuk update rating semua freelancer yang ada:
- `updateAllFreelancerRatings()`: Update rating semua freelancer profiles
- `createMissingFreelancerProfiles()`: Buat profile untuk freelancer yang belum punya
- Added npm script: `npm run db:update-ratings`

## How the New System Works

### Rating Calculation
1. **Get All Freelancer Gigs**: Query semua gigs aktif milik freelancer
2. **Calculate Each Gig Rating**: Untuk setiap gig, hitung average rating dari reviews
3. **Weighted Average**: Hitung rata-rata tertimbang berdasarkan jumlah review per gig
4. **Final Rating**: Round ke 1 decimal place

### Review Count Calculation
1. **Get All Reviews**: Ambil semua review dari semua gigs freelancer
2. **Sum Total**: Hitung total jumlah review
3. **Display**: Tampilkan total review count

### Data Flow
```
Freelancer Profile/Dashboard Request
↓
freelancerRatingService.calculateFreelancerRatingStats()
↓
Get all freelancer gigs → Get reviews for each gig → Calculate weighted average
↓
Return { averageRating, totalReviews, gigRatings }
```

## Benefits

1. **Accurate Rating**: Rating berdasarkan semua gigs, bukan data statis
2. **Real-time Updates**: Rating selalu up-to-date dengan review terbaru
3. **Weighted Calculation**: Gigs dengan lebih banyak review memiliki pengaruh lebih besar
4. **Comprehensive Reviews**: Menampilkan semua review dari semua gigs freelancer
5. **Consistent Data**: Semua halaman menggunakan calculation yang sama

## Usage

### Run Rating Update Script
```bash
npm run db:update-ratings
```

### Manual Rating Calculation
```javascript
import freelancerRatingService from './services/freelancerRatingService';

const ratingStats = await freelancerRatingService.calculateFreelancerRatingStats(freelancerId);
console.log(`Rating: ${ratingStats.averageRating}, Reviews: ${ratingStats.totalReviews}`);
```

## Migration Notes

1. **Existing Data**: Script akan update semua freelancer profiles dengan calculated ratings
2. **Backward Compatibility**: Sistem masih bisa baca rating lama jika calculation gagal
3. **Performance**: Calculation dilakukan on-demand, consider caching untuk production
4. **Database**: Tidak ada perubahan schema, hanya update nilai rating dan totalReviews

## Testing

1. Verify rating calculation dengan manual check
2. Test semua halaman yang menampilkan freelancer rating
3. Ensure reviews ditampilkan dari collection Reviews
4. Test performance dengan freelancer yang punya banyak gigs

## Future Improvements

1. **Caching**: Implement caching untuk rating calculation
2. **Background Jobs**: Update ratings secara periodic
3. **Real-time Updates**: Update rating saat ada review baru
4. **Analytics**: Track rating changes over time 