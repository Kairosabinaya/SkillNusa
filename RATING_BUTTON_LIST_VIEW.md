# Rating Button in Transaction List View

## Problem
Tombol "Beri Rating" hanya muncul di halaman detail order (`/dashboard/client/transactions/{id}`), padahal user juga perlu bisa akses dari halaman transaction list (`/dashboard/client/transactions`) untuk kemudahan.

## Solution
Menambahkan tombol "Beri Rating" di transaction card pada list view untuk order yang statusnya `completed` dan belum di-rating.

## Implementation

### Transaction Card Actions - Before:
```javascript
<div className="flex items-center space-x-3 ml-4">
  <Link to="/messages">Pesan</Link>
  <Link to="/detail">Detail</Link>
</div>
```

### Transaction Card Actions - After:
```javascript
<div className="flex items-center space-x-3 ml-4">
  <Link to="/messages">Pesan</Link>
  
  {/* Rating button for unrated completed orders */}
  {order.status === 'completed' && !orderRatingStatus[order.id] && (
    <button onClick={() => handleRateOrder(order.id)}>
      Beri Rating
    </button>
  )}
  
  {/* "Already rated" indicator */}
  {order.status === 'completed' && orderRatingStatus[order.id] && (
    <span>Sudah Dirating</span>
  )}
  
  <Link to="/detail">Detail</Link>
</div>
```

## Features Added

### 1. Rating Button for Completed Orders
- **Condition**: `order.status === 'completed' && !orderRatingStatus[order.id]`
- **Styling**: Yellow background (`bg-yellow-600`) with star icon
- **Action**: Calls `handleRateOrder(order.id)` yang sudah ada
- **Modal**: Menggunakan `RatingModal` yang sama dengan detail view

### 2. "Already Rated" Indicator  
- **Condition**: `order.status === 'completed' && orderRatingStatus[order.id]`
- **Styling**: Gray background dengan filled star icon
- **Purpose**: Menunjukkan order sudah diberi rating

### 3. Consistent State Management
- **Rating Status**: Menggunakan `orderRatingStatus` state yang sudah ada
- **Modal Handling**: Menggunakan `showRatingModal`, `pendingOrderCompletion` yang sama
- **Submit Logic**: Menggunakan `handleRatingSubmit` yang sama

## User Experience Flow

### Before (hanya di detail):
1. User di transaction list → Klik "Detail" → Scroll ke sidebar → Klik "Beri Rating"

### After (di list dan detail):
1. **Option A**: User di transaction list → Klik "Beri Rating" langsung ✅
2. **Option B**: User di transaction list → Klik "Detail" → Klik "Beri Rating" di sidebar ✅

## Technical Details

### Button Styling:
- **Background**: `bg-yellow-600 hover:bg-yellow-700`
- **Icon**: Star outline icon (4x4 size)
- **Disabled State**: `disabled:opacity-50 disabled:cursor-not-allowed`
- **Text**: "Beri Rating"

### Already Rated Indicator:
- **Background**: `bg-gray-100`
- **Text Color**: `text-gray-600`
- **Icon**: Filled star icon with yellow color
- **Text**: "Sudah Dirating"

### State Dependencies:
- ✅ **orderRatingStatus**: Sudah di-load di `loadOrders()`
- ✅ **RatingModal**: Sudah ada di list view
- ✅ **handleRateOrder**: Sudah ada dan working
- ✅ **handleRatingSubmit**: Sudah ada dan working

## Files Modified
- `src/pages/Dashboard/ClientTransactions.js` - Added rating button to transaction cards

## Testing Scenarios

### ✅ Completed Order - Not Rated:
- Shows yellow "Beri Rating" button
- Button clickable dan opens rating modal
- Modal bisa submit rating

### ✅ Completed Order - Already Rated:
- Shows gray "Sudah Dirating" indicator  
- No button interaction (read-only)

### ✅ Other Status Orders:
- No rating button/indicator shown
- Normal "Pesan" and "Detail" buttons only

### ✅ Responsive Layout:
- Buttons stack properly on smaller screens
- Icons and text readable at all sizes 