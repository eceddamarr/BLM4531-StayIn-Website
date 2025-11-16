<script setup>
import SearchBar from '../components/SearchBar.vue';
import LoginModal from '../components/LoginModal.vue';
import RegisterModal from '../components/RegisterModal.vue';
import ForgotPasswordModal from '../components/ForgotPasswordModal.vue';

import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router';

import api, { favoritesAPI, listingAPI } from "@/services/api.js";
import { user, clearUser } from '@/stores/userStore';

const router = useRouter();


const isLoginModalOpen = ref(false)
const isRegisterModalOpen = ref(false)
const isForgotPasswordModalOpen = ref(false)
const loginError = ref("");
const registerError = ref("");
const isProfileMenuOpen = ref(false);
const searchQuery = ref('');

// Favoriler
const favorites = ref([]);

// Favori yükle (backend'den)
const loadFavorites = async () => {
  if (!user.value) {
    favorites.value = [];
    return;
  }
  
  try {
    const response = await favoritesAPI.getFavorites();
    
    // Backend favorileri obje olarak döndürüyor: { favorites: [...] }
    const favData = response.data?.favorites || response.data || [];
    
    // Sadece ID'leri al - Backend'de Id büyük harfle
    favorites.value = favData.map(listing => listing.Id || listing.id);
  } catch (error) {
    // 401 hatası normaldir (kullanıcı çıkış yapmış olabilir)
    if (error.response?.status !== 401) {
      console.error('Favoriler yüklenemedi:', error);
    }
    favorites.value = [];
  }
};

// Favori ekle/çıkar (backend'e kaydet)
const toggleFavorite = async (listingId) => {
  if (!user.value) {
    openLoginModal();
    return;
  }
  
  const index = favorites.value.indexOf(listingId);
  const isRemoving = index !== -1;
  
  // Optimistic update - UI'ı hemen güncelle
  if (isRemoving) {
    favorites.value.splice(index, 1);
  } else {
    favorites.value.push(listingId);
  }
  
  try {
    if (isRemoving) {
      // Backend'den çıkar
      await favoritesAPI.removeFavorite(listingId);
    } else {
      // Backend'e ekle
      await favoritesAPI.addFavorite(listingId);
    }
  } catch (error) {
    console.error('Favori güncellenemedi:', error);
    
    // Hata durumunda geri al
    if (isRemoving) {
      favorites.value.push(listingId);
    } else {
      const idx = favorites.value.indexOf(listingId);
      if (idx !== -1) favorites.value.splice(idx, 1);
    }
    
    // Kullanıcıya hata göster
    alert('Favori güncellenirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
  }
};

// İlanın favori olup olmadığını kontrol et
const isFavorite = (listingId) => {
  const result = favorites.value.includes(listingId);
  return result;
};

// Helper: Listing ID'sini normalize et
const getListingId = (listing) => {
  return listing.id;
};

// İlanları yükle
const listings = ref([]);
const loadListings = async () => {
  try {
    const response = await listingAPI.getAllListings();
    const data = response.data;
    // Backend'den gelen property'leri normalize et (büyük harflerden küçük harfe)
    listings.value = data.map(listing => ({
      id: listing.Id || listing.id,
      title: listing.Title || listing.title,
      description: listing.Description || listing.description,
      placeType: listing.PlaceType || listing.placeType,
      guests: listing.Guests || listing.guests,
      bedrooms: listing.Bedrooms || listing.bedrooms,
      beds: listing.Beds || listing.beds,
      price: listing.Price || listing.price,
      photoUrls: listing.PhotoUrls || listing.photoUrls,
      address: listing.Address || listing.address,
      userId: listing.UserId || listing.userId
    }));
  } catch (err) {
    console.error('İlanlar yüklenemedi:', err);
    alert('İlanlar yüklenirken bir hata oluştu');
  }
};

// Arama fonksiyonu
const handleSearch = (query) => {
  searchQuery.value = query.toLowerCase();
};

// Filtrelenmiş ilanlar
const filteredListings = computed(() => {
  // Önce kullanıcının kendi ilanlarını filtrele
  let result = listings.value;
  
  // Giriş yapmış kullanıcının kendi ilanlarını gizle
  if (user.value) {
    const currentUserId = user.value.id || user.value.Id;
    result = result.filter(listing => listing.userId !== currentUserId);
  }
  
  // Arama filtresi
  if (!searchQuery.value) {
    return result;
  }
  
  return result.filter(listing => {
    const searchLower = searchQuery.value;
    const title = listing.title?.toLowerCase() || '';
    const description = listing.description?.toLowerCase() || '';
    const city = listing.address?.addressCity?.toLowerCase() || '';
    const country = listing.address?.addressCountry?.toLowerCase() || '';
    const district = listing.address?.addressDistrict?.toLowerCase() || '';
    const region = listing.address?.addressRegion?.toLowerCase() || '';
    const placeType = listing.placeType?.toLowerCase() || '';
    
    return title.includes(searchLower) ||
           description.includes(searchLower) ||
           city.includes(searchLower) ||
           country.includes(searchLower) ||
           district.includes(searchLower) ||
           region.includes(searchLower) ||
           placeType.includes(searchLower);
  });
});

onMounted(() => {
  // User artık global state'ten geliyor, localStorage'dan yüklemeye gerek yok
  loadListings();
  // Favorileri yükle - user zaten initUser ile yüklendi
  if (user.value) {
    loadFavorites();
  }
});

// User değişikliklerini izle (giriş/çıkış)
watch(user, (newUser) => {
  if (newUser) {
    // Kullanıcı giriş yaptı, favorileri yükle
    loadFavorites();
  } else {
    // Kullanıcı çıkış yaptı, favorileri temizle
    favorites.value = [];
  }
});


const openLoginModal = () => {
  loginError.value = ''; // Hata mesajını temizle
  isLoginModalOpen.value = true
}
const closeLoginModal = () => {
  loginError.value = ''; // Modal kapanırken hatayı temizle
  isLoginModalOpen.value = false
}
const closeRegisterModal = () => {
  registerError.value = '';
  isRegisterModalOpen.value = false
}
const closeForgotPasswordModal = () => {
  isForgotPasswordModalOpen.value = false
}

const switchToLogin = () => {
  isRegisterModalOpen.value = false
  isLoginModalOpen.value = true
  isForgotPasswordModalOpen.value = false
}

const switchToRegister = () => {
  isLoginModalOpen.value = false
  isRegisterModalOpen.value = true
}

const switchToForgotPassword = () => {
  isLoginModalOpen.value = false
  isRegisterModalOpen.value = false
  isForgotPasswordModalOpen.value = true
}

const handleLogin = (userData) => {
  // User artık global state'te, sadece favorileri yükle
  closeLoginModal();
  loadFavorites(); // Kullanıcı giriş yaptıktan sonra favorilerini yükle
};

const handleRegister = (userData) => {
  // User artık global state'te
  closeRegisterModal();
}


const handleForgotPassword = () => {
  forgotPasswordModalVisible.value = true;
};

const logout = () => {
  clearUser(); // Global state'i temizle (localStorage'dan da siler)
  favorites.value = []; // Çıkış yapınca favorileri temizle
  isProfileMenuOpen.value = false;
};

</script>

<template>
  <div class="min-h-screen">

    <!-- Navbar -->
  <header class="flex flex-row items-center justify-between px-8 py-4 shadow-sm rounded-b-2xl border-b border-gray-200">
    <div class="flex items-center gap-3">
      <img src="/src/assets/logo.png" alt="StayIn Logo" class="h-12 w-auto drop-shadow-md" />
    </div>
    <nav class="flex items-center gap-4">
      <router-link to="/become-host" class="px-4 py-2 rounded-lg font-medium text-primary">Ev Sahipliği Yapın</router-link>
      <div class="flex items-center gap-4">

      <!-- Kullanıcı giriş yapmışsa - Profil Menüsü -->
      <div v-if="user" class="relative">
        <button
          @click="isProfileMenuOpen = !isProfileMenuOpen"
          class="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-300 hover:shadow-md transition-all"
        >
          <i class="material-icons text-gray-600">menu</i>
          <i class="material-icons text-gray-600">account_circle</i>
        </button>

        <!-- Dropdown Menü -->
        <div
          v-if="isProfileMenuOpen"
          class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
        >
          <div class="px-4 py-3 border-b border-gray-200">
            <p class="font-semibold text-gray-800">{{ user.fullName }}</p>
            <p class="text-sm text-gray-500">{{ user.email }}</p>
          </div>
          
          <router-link to="/profile" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors">
            <i class="material-icons text-gray-600">person</i>
            <span>Profilim</span>
          </router-link>
          
          <router-link to="/my-listings" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors">
            <i class="material-icons text-gray-600">home</i>
            <span>İlanlarım</span>
          </router-link>
          
          <router-link to="/favorites" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors">
            <i class="material-icons text-gray-600">favorite</i>
            <span>Favorilerim</span>
          </router-link>
          
          <router-link to="/reservations" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors">
            <i class="material-icons text-gray-600">event</i>
            <span>Rezervasyonlarım</span>
          </router-link>
          
          <hr class="my-2" />
          
          <button
            @click="logout"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
          >
            <i class="material-icons text-gray-600">logout</i>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>


      <!-- Giriş yapmamışsa -->
      <button
        v-else
        @click="openLoginModal"
        class="bg-rose-600 text-white px-4 py-2 rounded-2xl hover:bg-rose-700"
      >
        Giriş Yap
      </button>
    </div>
    </nav>
  </header>

    <!-- Search Bar -->
    <div class="mt-10">
      <SearchBar :listings="listings" @search="handleSearch" /> 
    </div>

    <!-- Listings -->
    <section class="px-8 py-10">
      <h2 class="text-xl font-semibold mb-6">
        {{ searchQuery ? `"${searchQuery}" için ${filteredListings.length} sonuç` : `Popüler İlanlar (${listings.length})` }}
      </h2>
      <div v-if="filteredListings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="listing in filteredListings"
          :key="listing.id"
          @click="router.push(`/listing/${listing.id}`)"
          class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200 cursor-pointer"
        >
          <div class="relative h-48">
            <img
              :src="listing.photoUrls?.[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'"
              :alt="listing.title"
              class="w-full h-full object-cover"
            />
            <!-- Favori kalp ikonu -->
            <button
              @click.stop="toggleFavorite(listing.id)"
              class="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all hover:scale-110"
            >
              <i 
                class="material-icons transition-colors"
                :class="isFavorite(listing.id) ? 'text-red-500' : 'text-gray-400'"
              >
                {{ isFavorite(listing.id) ? 'favorite' : 'favorite_border' }}
              </i>
            </button>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1 truncate">{{ listing.title }}</h3>
            <p class="text-gray-500 text-sm mb-2">{{ listing.address.addressCity }}, {{ listing.address.addressCountry }}</p>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ listing.description }}</p>
            <div class="flex items-center justify-between">
              <span class="font-bold text-primary text-lg">₺{{ listing.price }}</span>
              <span class="text-gray-500 text-sm">gecelik</span>
            </div>
            <div class="mt-2 text-xs text-gray-400">
              {{ listing.guests }} misafir · {{ listing.bedrooms }} yatak odası · {{ listing.beds }} yatak
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-10">
        <i class="material-icons text-6xl text-gray-300 mb-4">search_off</i>
        <p class="text-xl">{{ searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : 'Henüz ilan bulunmuyor' }}</p>
        <p class="text-sm mt-2">{{ searchQuery ? 'Farklı bir arama yapın' : 'İlk ev sahibi siz olun!' }}</p>
      </div>
    </section>


    <LoginModal 
      :isOpen="isLoginModalOpen" 
      :errorMessage="loginError"
      @close="closeLoginModal"
      @login-success="handleLogin"
      @switch-to-register="switchToRegister"
      @switch-to-forgot-password="switchToForgotPassword"
      
    />

    <RegisterModal 
      :isOpen="isRegisterModalOpen" 
      :errorMessage="registerError"
      @close="closeRegisterModal"
      @register-success="handleRegister"
      @switch-to-login="switchToLogin"
    />

    <ForgotPasswordModal 
      :isOpen="isForgotPasswordModalOpen" 
      @close="closeForgotPasswordModal"
      @forgot-password-success="handleForgotPassword"
      @switch-to-forgot-password="switchToForgotPassword"
      @switch-to-login="switchToLogin"
    />
  </div>
</template>
