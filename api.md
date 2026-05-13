# 📱 Kilatz Mobile — API Documentation

> **Versi:** 1.1.0  
> **Diperbarui:** 2026-05-12  
> **Base URL:** `{BASE_URL}/api`  
> **Format:** JSON  
> **Auth:** Bearer Token (Laravel Sanctum)

---

## 🌐 Global Request Headers

Semua request **wajib** menyertakan header berikut:

| Header | Value | Keterangan |
|---|---|---|
| `Content-Type` | `application/json` | Wajib di semua request |
| `Accept` | `application/json` | Wajib di semua request |
| `Authorization` | `Bearer {access_token}` | Wajib untuk endpoint yang butuh auth ✅ |
| `X-Device-ID` | `{uuid}` | UUID unik per device, dikirim di **semua** request |

> `X-Device-ID` di-generate otomatis oleh mobile app menggunakan `expo-secure-store`. Digunakan untuk audit trail dan device tracking.

---

## 🔐 1. Authentication

### 1.1 Login Employee

Login menggunakan `username` + `pin_code`. Mobile app menyertakan `outlet_id` yang dipilih user saat login, serta info device untuk keperluan audit.

```
POST /api/v1/login
Auth: ❌ Tidak diperlukan
```

**Request Body:**

```json
{
  "login_type": "employee",
  "username": "string",
  "pin_code": "string (4-6 digit)",
  "outlet_id": "integer | null",
  "device_id": "string (UUID)",
  "device_model": "string (e.g. Samsung Galaxy S23)",
  "device_os": "string (e.g. Android 14)"
}
```

> ⚠️ `outlet_id` dikirim oleh user dari form login. Backend **harus memvalidasi** bahwa employee memiliki akses ke outlet tersebut.

**Response `200 OK`:**

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "employee": {
    "id": 1,
    "name": "string",
    "tenant_id": 1,
    "outlet_id": 1
  },
  "tenant_id": 1,
  "outlet_id": 1,
  "role": "CASHIER | SUPERVISOR | OWNER"
}
```

---

### 1.2 Register Employee Baru

Mendaftarkan akun employee baru. Endpoint ini **tidak memerlukan auth** (digunakan dari halaman Register).

```
POST /api/v1/register
Auth: ❌ Tidak diperlukan
```

**Request Body:**

```json
{
  "outlet_id": 1,
  "name": "string (min: 2 karakter)",
  "username": "string (min: 3 karakter, hanya huruf kecil/angka/underscore)",
  "pin_code": "string (4-6 digit, numerik)",
  "role": "CASHIER | SUPERVISOR | OWNER",
  "device_id": "string (UUID)",
  "device_model": "string",
  "device_os": "string"
}
```

**Validasi backend yang diharapkan:**
- `username` harus unik per outlet
- `pin_code` harus numerik, panjang 4-6 karakter
- `role` harus salah satu dari enum yang valid
- `outlet_id` harus ada di database

**Response `201 Created`:**

```json
{
  "message": "Akun berhasil dibuat. Silakan login."
}
```

**Response `422 Unprocessable Entity`:**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "username": ["Username sudah digunakan."],
    "pin_code": ["PIN harus 4-6 digit numerik."]
  }
}
```

---

### 1.3 Logout

Menginvalidasi token di sisi server dan menghapus session.

```
POST /api/v1/logout
Auth: ✅ Bearer Token
```

**Request Body:** `{}` _(kosong)_

**Response `200 OK`:**

```json
{
  "message": "Logged out successfully"
}
```

---

## 📦 2. Products

> Semua endpoint products membutuhkan autentikasi.

### 2.1 Get All Products

```
GET /api/v1/products
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "string",
      "sku": "string | null",
      "price": 15000.0,
      "stock": 100,
      "category": "string | null",
      "image_uri": "string | null",
      "is_active": 1
    }
  ]
}
```

---

### 2.2 Create Product

```
POST /api/v1/products
Auth: ✅ Bearer Token
```

**Request Body:**

```json
{
  "name": "string",
  "sku": "string | null",
  "price": 15000.0,
  "stock": 100,
  "category": "string | null",
  "image_uri": "string | null",
  "is_active": 1
}
```

**Response `201 Created`:**

```json
{
  "data": {
    "id": 1,
    "name": "string",
    "sku": "string | null",
    "price": 15000.0,
    "stock": 100,
    "category": "string | null",
    "image_uri": "string | null",
    "is_active": 1
  },
  "message": "Product created successfully"
}
```

---

### 2.3 Update Product

```
PUT /api/v1/products/{id}
Auth: ✅ Bearer Token
```

**Request Body:** _(semua field optional, kirim hanya yang diupdate)_

```json
{
  "name": "string",
  "sku": "string | null",
  "price": 15000.0,
  "stock": 100,
  "category": "string | null",
  "image_uri": "string | null",
  "is_active": 1
}
```

**Response `200 OK`:**

```json
{
  "data": { "...product object..." },
  "message": "Product updated successfully"
}
```

---

### 2.4 Delete Product *(Soft Delete)*

```
DELETE /api/v1/products/{id}
Auth: ✅ Bearer Token
```

> ⚠️ Mobile app menggunakan **soft delete** — backend cukup set `is_active = 0`, jangan hapus permanen dari database.

**Response `200 OK`:**

```json
{
  "message": "Product deleted successfully"
}
```

---

## 🗂️ 3. Categories

### 3.1 Get All Categories

```
GET /api/v1/categories
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "string",
      "type": "FOOD | DRINK | OTHER",
      "icon": "string | null"
    }
  ]
}
```

---

### 3.2 Create Category

```
POST /api/v1/categories
Auth: ✅ Bearer Token
```

**Request Body:**

```json
{
  "name": "string",
  "type": "FOOD | DRINK | OTHER",
  "icon": "string | null"
}
```

**Response `201 Created`:**

```json
{
  "data": {
    "id": 1,
    "name": "string",
    "type": "FOOD",
    "icon": "string | null"
  },
  "message": "Category created successfully"
}
```

---

### 3.3 Update Category

```
PUT /api/v1/categories/{id}
Auth: ✅ Bearer Token
```

**Request Body:**

```json
{
  "name": "string",
  "type": "FOOD | DRINK | OTHER",
  "icon": "string | null"
}
```

**Response `200 OK`:**

```json
{
  "data": { "...category object..." },
  "message": "Category updated successfully"
}
```

---

### 3.4 Delete Category

```
DELETE /api/v1/categories/{id}
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "message": "Category deleted successfully"
}
```

---

## 🧾 4. Transactions (Orders)

### 4.1 Checkout / Create Transaction

Saat kasir menyelesaikan transaksi. Backend harus:
- Membuat record order baru
- Insert semua order items
- Otomatis **mengurangi stok** produk sesuai quantity

```
POST /api/v1/transactions
Auth: ✅ Bearer Token
```

**Request Body:**

```json
{
  "invoice_number": "INV-1715123456789",
  "total_amount": 75000.0,
  "payment_method": "CASH | QRIS | DEBIT",
  "cashier_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 15000.0,
      "subtotal": 30000.0
    }
  ]
}
```

**Response `201 Created`:**

```json
{
  "data": {
    "id": 1,
    "invoice_number": "INV-1715123456789",
    "total_amount": 75000.0,
    "payment_method": "CASH",
    "cashier_id": 1,
    "created_at": "2024-05-08T10:30:00Z",
    "status": "COMPLETED"
  },
  "message": "Transaction completed successfully"
}
```

---

### 4.2 Get Transaction History

```
GET /api/v1/transactions
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "invoice_number": "INV-1715123456789",
      "total_amount": 75000.0,
      "payment_method": "CASH",
      "cashier_id": 1,
      "created_at": "2024-05-08T10:30:00Z",
      "status": "COMPLETED"
    }
  ]
}
```

---

### 4.3 Get Detail Item Transaksi

```
GET /api/v1/transactions/{id}/items
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "string",
      "quantity": 2,
      "unit_price": 15000.0,
      "subtotal": 30000.0
    }
  ]
}
```

---

## 🎮 5. Rooms (PS / Rental)

### 5.1 Get All Rooms

```
GET /api/v1/rooms
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "PS5 Room 1",
      "type": "REGULAR | VIP",
      "hourly_rate": 15000.0,
      "status": "AVAILABLE | OCCUPIED | MAINTENANCE"
    }
  ]
}
```

---

### 5.2 Start Room Session

Backend harus:
- Membuat room session baru dengan `status = ACTIVE`
- Mengubah status room menjadi `OCCUPIED`

```
POST /api/v1/rooms/{roomId}/sessions/start
Auth: ✅ Bearer Token
```

**Request Body:** `{}` _(kosong)_

**Response `201 Created`:**

```json
{
  "data": {
    "id": 1,
    "room_id": 1,
    "start_time": "2024-05-08T10:00:00Z",
    "end_time": null,
    "total_cost": null,
    "status": "ACTIVE"
  },
  "message": "Room session started"
}
```

---

### 5.3 Stop Room Session

Backend harus:
- Update `end_time` dan `total_cost` di room session
- Set `status = COMPLETED`
- Ubah status room kembali menjadi `AVAILABLE`

```
POST /api/v1/rooms/{roomId}/sessions/{sessionId}/stop
Auth: ✅ Bearer Token
```

**Request Body:**

```json
{
  "total_cost": 45000.0
}
```

**Response `200 OK`:**

```json
{
  "data": {
    "id": 1,
    "room_id": 1,
    "start_time": "2024-05-08T10:00:00Z",
    "end_time": "2024-05-08T13:00:00Z",
    "total_cost": 45000.0,
    "status": "COMPLETED"
  },
  "message": "Room session ended"
}
```

---

### 5.4 Get Active Session for Room

```
GET /api/v1/rooms/{roomId}/sessions/active
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": {
    "id": 1,
    "room_id": 1,
    "start_time": "2024-05-08T10:00:00Z",
    "end_time": null,
    "total_cost": null,
    "status": "ACTIVE"
  }
}
```

> Kembalikan `"data": null` jika tidak ada sesi aktif di room tersebut.

---

## 📊 6. Reports

### 6.1 Daily Stats

```
GET /api/v1/reports/daily
Auth: ✅ Bearer Token
```

**Query Params (opsional):**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `date` | `string` | hari ini | Format: `YYYY-MM-DD` |

**Response `200 OK`:**

```json
{
  "data": {
    "total_sales": 1500000.0,
    "transaction_count": 45
  }
}
```

---

### 6.2 Top Products

```
GET /api/v1/reports/top-products
Auth: ✅ Bearer Token
```

**Query Params (opsional):**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `limit` | `integer` | 5 | Jumlah produk yang dikembalikan |
| `date` | `string` | hari ini | Format: `YYYY-MM-DD` |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "name": "string",
      "quantity": 20,
      "total": 300000.0
    }
  ]
}
```

---

## 👤 7. Employees

### 7.1 Get All Employees

```
GET /api/v1/employees
Auth: ✅ Bearer Token
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "string",
      "username": "string",
      "role": "CASHIER | SUPERVISOR | OWNER",
      "pin": "string | null"
    }
  ]
}
```

---

## ❌ Error Response Format

Semua error harus menggunakan format standar berikut agar bisa ditangkap oleh mobile app:

### `422` — Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "username": ["The username field is required."],
    "pin_code": ["The pin code must be 4 digits."]
  }
}
```

### `401` — Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### `403` — Forbidden
```json
{
  "message": "Akses ditolak. Role Anda tidak memiliki izin."
}
```

### `404` — Not Found
```json
{
  "message": "Resource not found."
}
```

### `500` — Server Error
```json
{
  "message": "Server error occurred."
}
```

---

## 🔑 Role & Akses

| Role | Deskripsi | Akses |
|---|---|---|
| `OWNER` | Pemilik outlet | Semua fitur |
| `SUPERVISOR` | Kepala shift | Produk, Kategori, Laporan, Transaksi |
| `CASHIER` | Kasir harian | Transaksi, POS, Lihat Produk |

> Backend **disarankan** menggunakan middleware role-check per endpoint, terutama untuk aksi write (create/update/delete) di Products, Categories, dan Reports.

---

## 🔄 Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| `1.1.0` | 2026-05-12 | Tambah endpoint `POST /v1/register`; Update `POST /v1/login` dengan field `outlet_id` |
| `1.0.0` | 2026-05-12 | Rilis awal dokumentasi API |

---

## 📋 Ringkasan Semua Endpoint

| # | Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|---|
| 1 | `POST` | `/v1/login` | ❌ | Login dengan PIN + outlet ID |
| 2 | `POST` | `/v1/register` | ❌ | Daftar akun employee baru |
| 3 | `POST` | `/v1/logout` | ✅ | Logout & invalidate token |
| 4 | `GET` | `/v1/products` | ✅ | List semua produk |
| 5 | `POST` | `/v1/products` | ✅ | Tambah produk baru |
| 6 | `PUT` | `/v1/products/{id}` | ✅ | Update produk |
| 7 | `DELETE` | `/v1/products/{id}` | ✅ | Soft delete produk |
| 8 | `GET` | `/v1/categories` | ✅ | List kategori |
| 9 | `POST` | `/v1/categories` | ✅ | Tambah kategori |
| 10 | `PUT` | `/v1/categories/{id}` | ✅ | Update kategori |
| 11 | `DELETE` | `/v1/categories/{id}` | ✅ | Hapus kategori |
| 12 | `POST` | `/v1/transactions` | ✅ | Buat transaksi (checkout) |
| 13 | `GET` | `/v1/transactions` | ✅ | History transaksi |
| 14 | `GET` | `/v1/transactions/{id}/items` | ✅ | Detail item transaksi |
| 15 | `GET` | `/v1/rooms` | ✅ | List semua room |
| 16 | `POST` | `/v1/rooms/{id}/sessions/start` | ✅ | Mulai sesi room |
| 17 | `POST` | `/v1/rooms/{id}/sessions/{sid}/stop` | ✅ | Stop sesi room |
| 18 | `GET` | `/v1/rooms/{id}/sessions/active` | ✅ | Cek sesi aktif room |
| 19 | `GET` | `/v1/reports/daily` | ✅ | Statistik harian |
| 20 | `GET` | `/v1/reports/top-products` | ✅ | Produk terlaris |
| 21 | `GET` | `/v1/employees` | ✅ | List employees |
