# MovieBase - Upgrade Plan

**Analiz Tarihi:** 2026-02-16
**Tip:** Vite + React + TypeScript + Supabase

---

## Kritik Upgrades

### 1. Duplicate Favorites Logic - DRY Fix
**Oncelik:** KRITIK
**Dosyalar:** `MovieCard.tsx`, `App.tsx`

Ayni checkFavorite, auth subscription ve realtime channel kodu iki yerde tekrar ediyor.

**Gorev:**
- [ ] `useFavorites` hook'unu MovieCard'da kullan
- [ ] `useFavorites` hook'unu MovieDetailModal'da kullan
- [ ] Duplicate kodu kaldir

---

### 2. MovieDetailModal Ayirma
**Oncelik:** KRITIK
**Dosya:** `App.tsx` (satir 45-369)

325 satirlik component App.tsx icinde tanimli.

**Gorev:**
- [ ] `/components/MovieDetailModal.tsx` dosyasi olustur
- [ ] Component'i tasir
- [ ] App.tsx'i sadece import eden hale getir

---

### 3. useFavorites Async IIFE Bug Fix
**Oncelik:** KRITIK
**Dosya:** `hooks/useFavorites.ts` (satir 59-62)

```ts
// BUG: Promise string'e donusuyor
filter: `user_id=eq.${(async () => { ... })()}`
```

**Gorev:**
- [ ] Async IIFE'yi duzelt
- [ ] user.id'yi useEffect icinde await et
- [ ] Filter'i dogru sekilde olustur

---

## Yuksek Oncelikli Upgrades

### 4. Platform Provider Tum Sayfalarda
**Oncelik:** YUKSEK
**Dosya:** `services/tmdbService.ts` (satir 224-231)

Watch provider sadece ilk sayfada cekiliyor.

**Gorev:**
- [ ] Tum sayfalarda provider bilgisi cek
- [ ] Veya cache mekanizmasi ekle

---

### 5. AuthContext Olusturma
**Oncelik:** YUKSEK

`isLoggedIn` props drilling yapiliyor.

```bash
# Context yapisi
/context/AuthContext.tsx
```

**Gorev:**
- [ ] AuthContext provider olustur
- [ ] isLoggedIn prop'unu kaldir
- [ ] useAuth hook'u ile eris

---

### 6. Test Coverage
**Oncelik:** YUKSEK

```bash
npm install -D vitest @testing-library/react
```

**Gorev:**
- [ ] tmdbService icin unit test yaz
- [ ] useFavorites icin test yaz

---

## Orta Oncelikli Upgrades

### 7. Any Tipleri Temizle
**Dosyalar:** `Navbar.tsx`, `tmdbService.ts`

`useState<any>(null)` kullanimi tip guvenligini bozuyor.

**Gorev:**
- [ ] Supabase User tipini import et
- [ ] TMDB response tiplerini tanimla

---

### 8. Debounce Arama Ekleme
**Dosya:** `HeroSection.tsx`

Anlik arama yapilacaksa debounce gerekli.

**Gorev:**
- [ ] `useDebounce` hook'u ekle
- [ ] onChange aramasini throttle et

---

### 9. Watch Region Destegi
**Dosya:** `tmdbService.ts` (satir 10)

Sadece US region hardcoded.

**Gorev:**
- [ ] TR region destegi ekle
- [ ] Tarayici locale'inden oku
- [ ] Kullanici ayarlarina ekle

---

### 10. getPlatformColor Tekrari
**Dosyalar:** `App.tsx`, `MovieCard.tsx`

Ayni fonksiyon iki farkli yerde.

**Gorev:**
- [ ] `utils/platformColors.ts` olustur
- [ ] Tek yerden export et

---

## Onerilen Yeni Kutuphaneler

| Kategori | Kutuphane | Amac |
|----------|-----------|------|
| Test | `vitest` | Vite-native test |
| Caching | `@tanstack/react-query` | API cache, stale-while-revalidate |
| Toast | `react-hot-toast` | alert() yerine |
| Error | `react-error-boundary` | Hata yonetimi |
| Env | `zod` | Build-time env validation |

---

## Tahmini Is Yukleri

| Upgrade | Zorluk |
|---------|--------|
| DRY Favorites | Kolay |
| Modal Ayirma | Kolay |
| Async Bug Fix | Orta |
| AuthContext | Orta |
| Test Ekleme | Orta |
