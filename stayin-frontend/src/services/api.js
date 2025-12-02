import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5211/api", // .env'deki API adresini kullanır
});

// localStorage'daki token varsa otomatik olarak header'a ekler
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Favorites API
export const favoritesAPI = {
  // Kullanıcının favori listesini getir
  getFavorites: () => api.get('/Favorites'),
  
  // Favorilere ekle
  addFavorite: (listingId) => 
    api.post(`/Favorites/${listingId}`),
  
  // Favorilerden çıkar
  removeFavorite: (listingId) => 
    api.delete(`/Favorites/${listingId}`),
  
  // İlan favorilerde mi kontrol et
  checkFavorite: (listingId) => 
    api.get(`/Favorites/check/${listingId}`),
};

// MyListings API
export const myListingsAPI = {
  // Kullanıcının aktif ilanlarını getir
  getMyListings: () => api.get('/MyListings'),
  
  // Kullanıcının arşivlenmiş ilanlarını getir
  getArchivedListings: () => api.get('/MyListings/archived'),
  
  // Yeni ilan oluştur
  createListing: (listing) => 
    api.post('/MyListings', listing),
  
  // İlan güncelle
  updateListing: (id, listing) => 
    api.put(`/MyListings/${id}`, listing),
  
  // İlan sil
  deleteListing: (id) => 
    api.delete(`/MyListings/${id}`),
  
  // İlan arşivle/arşivden çıkar
  archiveListing: (id) => 
    api.post(`/MyListings/${id}/archive`),
};

// Listing API
export const listingAPI = {
  // Tüm ilanları getir
  getAllListings: () => api.get('/Listing/all'),
  
  // İlan detayını getir
  getListingById: (id) => api.get(`/Listing/${id}`),
};

// User API
export const userAPI = {
  // Kullanıcı bilgisini getir
  getUserById: (id) => api.get(`/User/${id}`),
};

// Profile API
export const profileAPI = {
  // Profil bilgilerini güncelle
  updateProfile: (data) => 
    api.put('/Auth/update-profile', data),
  
  // Şifre değiştir
  changePassword: (data) => 
    api.post('/Auth/change-password', data),
};

// Reservation API
export const reservationAPI = {
  // Rezervasyon oluştur
  createReservation: (reservation) => 
    api.post('/Reservation/create', reservation),
  
  // Kullanıcının yaptığı rezervasyonlar (Guest)
  getMyReservations: () => 
    api.get('/Reservation/my-reservations'),
  
  // Gelen rezervasyon talepleri (Host)
  getIncomingRequests: () => 
    api.get('/Reservation/incoming-requests'),
  
  // Rezervasyonu onayla (Host)
  approveReservation: (id) => 
    api.post(`/Reservation/${id}/approve`),
  
  // Rezervasyonu reddet (Host)
  rejectReservation: (id) => 
    api.post(`/Reservation/${id}/reject`),
  
  // Rezervasyonu iptal et (Guest)
  cancelReservation: (id) => 
    api.post(`/Reservation/${id}/cancel`),
};

// Payment API
export const paymentAPI = {
  // Rezervasyon için ödeme yap
  processPayment: (reservationId, paymentData) => 
    api.post(`/Payments/reservation/${reservationId}`, paymentData),

  // Rezervasyon ödeme detayı
  getPaymentByReservation: (reservationId) => 
    api.get(`/Payments/reservation/${reservationId}`),

  // Kullanıcının tüm ödemeleri
  getMyPayments: () => 
    api.get('/Payments/my-payments'),
};

// Review API
export const reviewAPI = {
  // Yorum oluştur
  createReview: (data) => 
    api.post('/Reviews', data),
  
  // İlan yorumlarını getir
  getListingReviews: (listingId) => 
    api.get(`/Reviews/listing/${listingId}`),
  
  // Kullanıcının yaptığı yorumlar
  getMyReviews: () => 
    api.get('/Reviews/my-reviews'),
  
  // Yorum güncelle
  updateReview: (id, data) => 
    api.put(`/Reviews/${id}`, data),
  
  // Yorum sil
  deleteReview: (id) => 
    api.delete(`/Reviews/${id}`),
};

export default api;
