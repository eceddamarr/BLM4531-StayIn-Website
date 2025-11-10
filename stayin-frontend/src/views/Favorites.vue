<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { favoritesAPI } from '@/services/api.js';

const router = useRouter();
const favoriteListings = ref([]);
const user = ref(null);
const isLoading = ref(true);

// Kullanıcı kontrolü ve favorileri yükle
onMounted(async () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    // Giriş yapmamışsa ana sayfaya yönlendir
    router.push('/');
    return;
  }
  user.value = JSON.parse(storedUser);
  await loadFavorites();
});

// Favorileri backend'den yükle
const loadFavorites = async () => {
  if (!user.value) return;
  
  try {
    isLoading.value = true;
    const response = await favoritesAPI.getFavorites();
    
    favoriteListings.value = response.data?.favorites || [];
    
  } catch (error) {
    console.error('Favoriler yüklenemedi:', error);
    favoriteListings.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Favoriden çıkar
const removeFavorite = async (listingId) => {
  if (!user.value) return;
  
  try {
    await favoritesAPI.removeFavorite(listingId);
    // Listeden kaldır
    favoriteListings.value = favoriteListings.value.filter(
      listing => listing.id !== listingId
    );
  } catch (error) {
    console.error('Favori silinemedi:', error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/">
            <img src="/src/assets/logo.png" alt="StayIn Logo" class="h-12 w-auto drop-shadow-md" />
          </router-link>
        </div>
        <router-link to="/" class="text-gray-600 hover:text-primary transition-colors">
          <i class="material-icons">arrow_back</i>
          Ana Sayfa
        </router-link>
      </div>
    </header>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-8 py-10">
      <div class="flex items-center gap-3 mb-8">
        <i class="material-icons text-4xl text-primary">favorite</i>
        <h1 class="text-3xl font-bold">Favorilerim</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-500">Favoriler yükleniyor...</p>
      </div>

      <!-- Favori ilanlar -->
      <div v-else-if="favoriteListings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="listing in favoriteListings"
          :key="listing.id"
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
              @click.stop="removeFavorite(listing.id)"
              class="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all hover:scale-110"
            >
              <i class="material-icons text-red-500">favorite</i>
            </button>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1 truncate">{{ listing.title }}</h3>
            <p class="text-gray-500 text-sm mb-2">{{ listing.address?.addressCity }}, {{ listing.address?.addressCountry }}</p>
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

      <!-- Boş durum -->
      <div v-else class="text-center py-20">
        <i class="material-icons text-gray-300 text-8xl mb-4">favorite_border</i>
        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Henüz favoriniz yok</h2>
        <p class="text-gray-500 mb-6">Beğendiğiniz ilanları favorilerinize ekleyin</p>
        <router-link to="/" class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          İlanları Keşfet
        </router-link>
      </div>
    </div>
  </div>
</template>
