<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { favoritesAPI, listingAPI, userAPI } from '@/services/api.js';
import { user } from '@/stores/userStore';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const listing = ref(null);
const host = ref(null); 
const loading = ref(true);
const currentImageIndex = ref(0);
const showAllPhotos = ref(false);
const checkInDate = ref('');
const checkOutDate = ref('');
const guests = ref(1);
const isFavorite = ref(false);

// İlan detaylarını yükle
const loadListing = async () => {
  try {
    const listingId = route.params.id;
    const response = await listingAPI.getListingById(listingId);
    
    const data = response.data;
    listing.value = {
      id: data.Id || data.id,
      title: data.Title || data.title,
      description: data.Description || data.description,
      placeType: data.PlaceType || data.placeType,
      guests: data.Guests || data.guests,
      bedrooms: data.Bedrooms || data.bedrooms,
      beds: data.Beds || data.beds,
      bathrooms: data.Bathrooms || data.bathrooms,
      price: data.Price || data.price,
      photoUrls: data.PhotoUrls || data.photoUrls || [],
      address: data.Address || data.address,
      amenities: data.Amenities || data.amenities || [],
      userId: data.UserId || data.userId,
      latitude: data.Latitude || data.latitude,
      longitude: data.Longitude || data.longitude
    };
    
    // İlan sahibi bilgisini yükle
    if (listing.value.userId) {
      await loadHost(listing.value.userId);
    }
    
    // Favori durumunu kontrol et
    if (user.value) {
      await checkFavoriteStatus();
    }
    
    // Haritayı yükle (DOM'un render olması için biraz bekle)
    await nextTick();
    if (listing.value.latitude && listing.value.longitude) {
      setTimeout(() => {
        initMap();
      }, 100);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message 
      || error.response?.data 
      || error.message 
      || 'Bilinmeyen bir hata oluştu';
    
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: `İlan yüklenemedi: ${errorMsg}`,
      life: 3000
    });
    router.push('/');
  } finally {
    loading.value = false;
  }
};

// İlan sahibi bilgisini yükle
const loadHost = async (userId) => {
  try {
    const response = await userAPI.getUserById(userId);
    host.value = {
      id: response.data.id,
      name: response.data.fullName
    };
  } catch (error) {
    host.value = {
      id: userId,
      name: 'Ev Sahibi'
    };
  }
};

// Favori durumunu kontrol et
const checkFavoriteStatus = async () => {
  if (!user.value) return;
  
  try {
    const response = await favoritesAPI.getFavorites();
    const favData = response.data?.favorites || response.data || [];
    const favIds = favData.map(item => item.Id || item.id);
    isFavorite.value = favIds.includes(listing.value.id);
  } catch (error) {
    isFavorite.value = false;
  }
};

// Favori ekle/çıkar
const toggleFavorite = async () => {
  if (!user.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Favorilere eklemek için giriş yapmalısınız',
      life: 3000
    });
    return;
  }
  
  const wasRemoving = isFavorite.value;
  isFavorite.value = !isFavorite.value;
  
  try {
    if (wasRemoving) {
      await favoritesAPI.removeFavorite(listing.value.id);
    } else {
      await favoritesAPI.addFavorite(listing.value.id);
    }
  } catch (error) {
    isFavorite.value = !isFavorite.value;
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Favori güncellenirken bir hata oluştu',
      life: 3000
    });
  }
};

// Toplam gece sayısı
const totalNights = computed(() => {
  if (!checkInDate.value || !checkOutDate.value) return 0;
  const start = new Date(checkInDate.value);
  const end = new Date(checkOutDate.value);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

// Toplam fiyat
const totalPrice = computed(() => {
  if (!listing.value) return 0;
  return listing.value.price * totalNights.value;
});

// Kullanıcının kendi ilanı mı kontrol et
const isOwnListing = computed(() => {
  if (!user.value || !listing.value) return false;
  return user.value.id === listing.value.userId;
});

// Rezervasyon yap
const makeReservation = () => {
  if (!user.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Rezervasyon yapmak için giriş yapmalısınız',
      life: 3000
    });
    return;
  }
  
  if (isOwnListing.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Kendi ilanınıza rezervasyon yapamazsınız',
      life: 3000
    });
    return;
  }
  
  if (!checkInDate.value || !checkOutDate.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Lütfen giriş ve çıkış tarihlerini seçin',
      life: 3000
    });
    return;
  }
  
  if (totalNights.value < 1) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Çıkış tarihi giriş tarihinden sonra olmalıdır',
      life: 3000
    });
    return;
  }
  
  // Rezervasyon işlemi (backend entegrasyonu sonra eklenebilir)
  toast.add({
    severity: 'success',
    summary: 'Başarılı',
    detail: `Rezervasyon talebi oluşturuldu!`,
    life: 5000
  });
};

// Resim navigasyonu
const nextImage = () => {
  if (listing.value && listing.value.photoUrls.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % listing.value.photoUrls.length;
  }
};

const prevImage = () => {
  if (listing.value && listing.value.photoUrls.length > 0) {
    currentImageIndex.value = currentImageIndex.value === 0 
      ? listing.value.photoUrls.length - 1 
      : currentImageIndex.value - 1;
  }
};

// Bugünün tarihi (minimum tarih)
const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Haritayı başlat
const initMap = () => {
  try {
    const mapId = `map-${listing.value.id}`;
    const mapElement = document.getElementById(mapId);
    
    if (!mapElement) return;
    
    // Haritayı oluştur
    const map = L.map(mapId).setView(
      [listing.value.latitude, listing.value.longitude], 
      13
    );
    
    // OpenStreetMap tile layer ekle
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Marker ekle
    const marker = L.marker([listing.value.latitude, listing.value.longitude]).addTo(map);
    marker.bindPopup(`<b>${listing.value.title}</b><br>${listing.value.address.addressCity}`);
    
    // Harita boyutunu güncelle
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  } catch (error) {
    // Sessizce hata yönet
  }
};

onMounted(() => {
  loadListing();
});
</script>

<template>
  <Toast />
  <div class="min-h-screen bg-white">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <i class="material-icons text-6xl text-gray-300 animate-pulse">home</i>
        <p class="mt-4 text-gray-500">Yükleniyor...</p>
      </div>
    </div>

    <!-- Listing Detail -->
    <div v-else-if="listing" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button 
        @click="router.push('/')"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <i class="material-icons">arrow_back</i>
        <span>Tüm İlanlar</span>
      </button>

      <!-- Title -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ listing.title }}</h1>
          <div class="flex items-center gap-4 text-gray-600">
            <span class="flex items-center gap-1">
              <i class="material-icons text-sm">location_on</i>
              {{ listing.address.addressCity }}, {{ listing.address.addressCountry }}
            </span>
          </div>
        </div>
        
        <!-- Favorite Button -->
        <button 
          @click="toggleFavorite"
          class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <i 
            class="material-icons transition-colors"
            :class="isFavorite ? 'text-red-500' : 'text-gray-600'"
          >
            {{ isFavorite ? 'favorite' : 'favorite_border' }}
          </i>
          <span>{{ isFavorite ? 'Favorilerden Çıkar' : 'Favoriye Ekle' }}</span>
        </button>
      </div>

      <!-- Photos Grid -->
      <div class="grid grid-cols-4 grid-rows-2 gap-2 mb-8 h-[500px] rounded-xl overflow-hidden">
        <!-- Main Photo -->
        <div 
          class="col-span-2 row-span-2 relative cursor-pointer group"
          @click="showAllPhotos = true"
        >
          <img 
            :src="listing.photoUrls[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'" 
            :alt="listing.title"
            class="w-full h-full object-cover group-hover:brightness-90 transition-all"
          />
        </div>
        
        <!-- Secondary Photos -->
        <div 
          v-for="(photo, index) in listing.photoUrls.slice(1, 5)" 
          :key="index"
          class="relative cursor-pointer group"
          @click="showAllPhotos = true"
        >
          <img 
            :src="photo || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'" 
            :alt="`${listing.title} - ${index + 2}`"
            class="w-full h-full object-cover group-hover:brightness-90 transition-all"
          />
          <!-- Show All Photos Button (last image) -->
          <button 
            v-if="index === 3 && listing.photoUrls.length > 5"
            class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white font-semibold hover:bg-opacity-50 transition-all"
          >
            <i class="material-icons mr-2">apps</i>
            Tüm fotoğrafları göster
          </button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Details -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Host Info -->
          <div class="pb-8 border-b border-gray-200">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl font-bold">
                {{ host?.name?.charAt(0) || 'E' }}
              </div>
              <div>
                <h3 class="text-xl font-semibold">{{ host?.name || 'Ev Sahibi' }} tarafından paylaşılan ilan</h3>
              </div>
            </div>
            <h2 class="text-2xl font-semibold mb-4">
              {{ listing.placeType }} - {{ listing.address.addressDistrict }}, {{ listing.address.addressCity }}
            </h2>
            <div class="flex items-center gap-4 text-gray-700">
              <span>{{ listing.guests }} misafir</span>
              <span>·</span>
              <span>{{ listing.bedrooms }} yatak odası</span>
              <span>·</span>
              <span>{{ listing.beds }} yatak</span>
              <span>·</span>
              <span>{{ listing.bathrooms || 1 }} banyo</span>
            </div>
          </div>

          <!-- Description -->
          <div class="pb-8 border-b border-gray-200">
            <h3 class="text-xl font-semibold mb-4">Konaklama yeri hakkında</h3>
            <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ listing.description }}</p>
          </div>

          <!-- Amenities -->
          <div class="pb-8 border-b border-gray-200" v-if="listing.amenities && listing.amenities.length > 0">
            <h3 class="text-xl font-semibold mb-4">Bu mekân size neler sunuyor?</h3>
            <div class="grid grid-cols-2 gap-4">
              <div 
                v-for="amenity in listing.amenities" 
                :key="amenity"
                class="flex items-center gap-3"
              >
                <i class="material-icons text-gray-600">check_circle</i>
                <span class="text-gray-700">{{ amenity }}</span>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div class="pb-8">
            <h3 class="text-xl font-semibold mb-4">Nerede olacaksınız</h3>
            
            <!-- Harita -->
            <div v-if="listing.latitude && listing.longitude" class="rounded-lg overflow-hidden border border-gray-200" style="height: 400px;">
              <div :id="`map-${listing.id}`" style="height: 100%; width: 100%;"></div>
            </div>
          </div>
        </div>

        <!-- Right Column - Reservation Card -->
        <div class="lg:col-span-1">
          <!-- Kendi İlanı -->
          <div v-if="isOwnListing" class="sticky top-8 border border-gray-300 rounded-xl shadow-lg p-6 bg-gray-50">
            <div class="text-center space-y-4">
              <div class="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <i class="material-icons text-5xl text-rose-600">home_work</i>
              </div>
              <h3 class="text-xl font-bold text-gray-800">Bu Sizin İlanınız</h3>
              <p class="text-gray-600">Bu ilana rezervasyon yapamazsınız</p>
              <button 
                @click="router.push('/my-listings')"
                class="w-full bg-rose-600 text-white py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
              >
                <i class="material-icons">edit</i>
                İlanlarımı Görüntüle
              </button>
            </div>
          </div>

          <!-- Rezervasyon Kartı (Başkasının İlanı) -->
          <div v-else class="sticky top-8 border border-gray-300 rounded-xl shadow-lg p-6">
            <!-- Price -->
            <div class="flex items-baseline gap-2 mb-6">
              <span class="text-3xl font-bold">₺{{ listing.price }}</span>
              <span class="text-gray-600">/ gece</span>
            </div>

            <!-- Date Inputs -->
            <div class="space-y-4 mb-4">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">GİRİŞ</label>
                  <input 
                    v-model="checkInDate"
                    type="date" 
                    :min="today"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">ÇIKIŞ</label>
                  <input 
                    v-model="checkOutDate"
                    type="date" 
                    :min="checkInDate || today"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <!-- Guests -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">MİSAFİR SAYISI</label>
                <div class="flex items-center gap-4">
                  <button 
                    @click="guests = Math.max(1, guests - 1)"
                    class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <i class="material-icons">remove</i>
                  </button>
                  <span class="font-semibold text-lg">{{ guests }}</span>
                  <button 
                    @click="guests = Math.min(listing.guests, guests + 1)"
                    class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <i class="material-icons">add</i>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">Maksimum {{ listing.guests }} misafir</p>
              </div>
            </div>

            <!-- Reserve Button -->
            <button 
              @click="makeReservation"
              class="w-full bg-rose-600 text-white py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors mb-4"
            >
              Rezervasyon Yap
            </button>

            <p class="text-center text-sm text-gray-500 mb-4">Henüz ücret alınmayacak</p>

            <!-- Price Breakdown -->
            <div v-if="totalNights > 0" class="space-y-3 pt-4 border-t border-gray-200">
              <div class="flex justify-between text-gray-700">
                <span>₺{{ listing.price }} x {{ totalNights }} gece</span>
                <span>₺{{ listing.price * totalNights }}</span>
              </div>
              <div class="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200">
                <span>Toplam</span>
                <span>₺{{ totalPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Photos Modal -->
    <div 
      v-if="showAllPhotos && listing" 
      class="fixed inset-0 bg-black z-50 overflow-y-auto"
    >
      <div class="min-h-screen p-8">
        <button 
          @click="showAllPhotos = false"
          class="fixed top-4 left-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
        >
          <i class="material-icons">close</i>
        </button>
        
        <div class="max-w-5xl mx-auto space-y-4 pt-16">
          <img 
            v-for="(photo, index) in listing.photoUrls" 
            :key="index"
            :src="photo"
            :alt="`${listing.title} - ${index + 1}`"
            class="w-full rounded-lg"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
}
</style>
