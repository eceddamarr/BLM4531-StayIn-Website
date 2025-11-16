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
  // Kullanıcının kendi ilanlarını getir
  getMyListings: () => api.get('/MyListings'),
  
  // Yeni ilan oluştur
  createListing: (listing) => 
    api.post('/MyListings', listing),
  
  // İlan güncelle
  updateListing: (id, listing) => 
    api.put(`/MyListings/${id}`, listing),
  
  // İlan sil
  deleteListing: (id) => 
    api.delete(`/MyListings/${id}`),
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

export default api;
