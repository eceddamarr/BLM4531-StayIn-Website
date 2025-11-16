<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { myListingsAPI } from '@/services/api.js';
import { user, checkAuth } from '@/stores/userStore';

const router = useRouter();
const myListings = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  // Global state'ten user kontrolü
  checkAuth();
  if (!user.value) {
    router.push('/');
    return;
  }
  await loadMyListings();
});

const loadMyListings = async () => {
  try {
    isLoading.value = true;
    const response = await myListingsAPI.getMyListings();
    
    // Backend'den gelen ilanları normalize et
    const listings = response.data?.listings || [];
    myListings.value = listings.map(listing => ({
      id: listing.Id || listing.id,
      title: listing.Title || listing.title,
      description: listing.Description || listing.description,
      placeType: listing.PlaceType || listing.placeType,
      accommodationType: listing.AccommodationType || listing.accommodationType,
      guests: listing.Guests || listing.guests,
      bedrooms: listing.Bedrooms || listing.bedrooms,
      beds: listing.Beds || listing.beds,
      bathrooms: listing.Bathrooms || listing.bathrooms,
      price: listing.Price || listing.price,
      address: {
        addressCountry: listing.Address?.AddressCountry || listing.address?.addressCountry || '',
        addressCity: listing.Address?.AddressCity || listing.address?.addressCity || '',
        addressDistrict: listing.Address?.AddressDistrict || listing.address?.addressDistrict || '',
        addressStreet: listing.Address?.AddressStreet || listing.address?.addressStreet || '',
      },
      amenities: listing.Amenities || listing.amenities || [],
      photoUrls: listing.PhotoUrls || listing.photoUrls || [],
      latitude: listing.Latitude || listing.latitude,
      longitude: listing.Longitude || listing.longitude,
      createdAt: listing.CreatedAt || listing.createdAt
    }));
    
  } catch (error) {
    console.error('İlanlar yüklenemedi:', error);
    console.error('Error details:', error.response?.data);
    myListings.value = [];
  } finally {
    isLoading.value = false;
  }
};

// İlan sil
const deleteListing = async (listingId) => {
  if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  try {
    await myListingsAPI.deleteListing(listingId);
    // Listeden kaldır
    myListings.value = myListings.value.filter(listing => listing.id !== listingId);
  } catch (error) {
    console.error('İlan silinemedi:', error);
    alert('İlan silinirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
  }
};

// İlan düzenlemeye git
const editListing = (listingId) => {
  // İlan düzenleme için BecomeHost sayfasına yönlendir (edit mode)
  router.push({ name: 'BecomeHost', query: { edit: listingId } });
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
        <router-link to="/" class="text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
          <i class="material-icons">arrow_back</i>
          Ana Sayfa
        </router-link>
      </div>
    </header>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-8 py-10">
      <div class="flex items-center gap-3 mb-8">
        <i class="material-icons text-4xl text-primary">home</i>
        <h1 class="text-3xl font-bold">İlanlarım</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-500">İlanlar yükleniyor...</p>
      </div>

      <!-- İlanlar -->
      <div v-else-if="myListings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="listing in myListings"
          :key="listing.id"
          class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200"
        >
          <div class="relative h-48">
            <img
              :src="listing.photoUrls?.[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'"
              :alt="listing.title"
              class="w-full h-full object-cover"
            />
            <!-- İlan kontrol butonları -->
            <div class="absolute top-3 right-3 flex gap-2">
              <button
                @click.stop="editListing(listing.id)"
                class="p-2 rounded-full bg-white/90 hover:bg-white transition-all hover:scale-110"
                title="Düzenle"
              >
                <i class="material-icons text-blue-600 text-xl">edit</i>
              </button>
              <button
                @click.stop="deleteListing(listing.id)"
                class="p-2 rounded-full bg-white/90 hover:bg-white transition-all hover:scale-110"
                title="Sil"
              >
                <i class="material-icons text-red-600 text-xl">delete</i>
              </button>
            </div>
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
            <div class="mt-2 text-xs text-gray-400">
              Oluşturulma: {{ new Date(listing.createdAt).toLocaleDateString('tr-TR') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Boş durum -->
      <div v-else class="text-center py-20">
        <i class="material-icons text-gray-300 text-8xl mb-4">home_work</i>
        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Henüz ilanınız yok</h2>
        <p class="text-gray-500 mb-6">İlk ilanınızı oluşturun ve kazanmaya başlayın</p>
        <router-link to="/become-host" class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          İlan Oluştur
        </router-link>
      </div>
    </div>
  </div>
</template>
