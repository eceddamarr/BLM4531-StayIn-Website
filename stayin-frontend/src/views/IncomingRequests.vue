<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { reservationAPI, paymentAPI } from '@/services/api.js';
import { user, checkAuth } from '@/stores/userStore';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const router = useRouter();
const toast = useToast();
const requests = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  checkAuth();
  if (!user.value) {
    router.push('/');
    return;
  }
  await loadRequests();
});

const loadRequests = async () => {
  try {
    isLoading.value = true;
    const response = await reservationAPI.getIncomingRequests();
    // Backend'den gelen PascalCase verileri camelCase'e çevir
    const data = response.data?.requests || response.data || [];
    const mappedRequests = Array.isArray(data) ? data.map(r => ({
      id: r.Id || r.id,
      listingTitle: r.ListingTitle || r.listingTitle,
      listingPhotoUrl: r.ListingPhotoUrl || r.listingPhotoUrl,
      guestName: r.GuestName || r.guestName,
      guestEmail: r.GuestEmail || r.guestEmail,
      checkInDate: r.CheckInDate || r.checkInDate,
      checkOutDate: r.CheckOutDate || r.checkOutDate,
      guests: r.Guests || r.guests,
      totalPrice: r.TotalPrice || r.totalPrice,
      status: r.Status || r.status,
      createdAt: r.CreatedAt || r.createdAt,
      responsedAt: r.ResponsedAt || r.responsedAt,
      isPaid: r.IsPaid || r.isPaid || false,
      paymentDate: r.PaymentDate || r.paymentDate
    })) : [];
    
    // Her rezervasyon için ödeme bilgisini backend'den çek
    for (const request of mappedRequests) {
      try {
        const paymentResponse = await paymentAPI.getPaymentByReservation(request.id);
        if (paymentResponse.data.success && paymentResponse.data.data) {
          request.isPaid = true;
          request.paymentDate = paymentResponse.data.data.paymentDate;
          request.transactionId = paymentResponse.data.data.transactionId;
        }
      } catch (error) {
        // Ödeme bulunamadıysa (404) normal, hata vermeden devam et
        if (error.response?.status !== 404) {
          console.error(`Request ${request.id} için ödeme bilgisi alınamadı:`, error);
        }
      }
    }
    
    requests.value = mappedRequests;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Talepler yüklenemedi',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

const approveRequest = async (requestId) => {
  try {
    await reservationAPI.approveReservation(requestId);
    toast.add({
      severity: 'success',
      summary: 'Başarılı',
      detail: 'Rezervasyon onaylandı',
      life: 3000
    });
    await loadRequests();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.response?.data?.message || 'Rezervasyon onaylanamadı',
      life: 3000
    });
  }
};

const rejectRequest = async (requestId) => {
  if (!confirm('Bu rezervasyonu reddetmek istediğinizden emin misiniz?')) {
    return;
  }
  
  try {
    await reservationAPI.rejectReservation(requestId);
    toast.add({
      severity: 'success',
      summary: 'Başarılı',
      detail: 'Rezervasyon reddedildi',
      life: 3000
    });
    await loadRequests();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.response?.data?.message || 'Rezervasyon reddedilemedi',
      life: 3000
    });
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    case 'Cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'Pending': return 'Onay Bekliyor';
    case 'Approved': return 'Onaylandı';
    case 'Rejected': return 'Reddedildi';
    case 'Cancelled': return 'İptal Edildi';
    default: return status;
  }
};

const isFutureReservation = (request) => {
  const checkInDate = new Date(request.checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkInDate > today;
};
</script>

<template>
  <Toast />
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
        <i class="material-icons text-4xl text-primary">inbox</i>
        <h1 class="text-3xl font-bold">Gelen Rezervasyon Talepleri</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-500">Talepler yükleniyor...</p>
      </div>

      <!-- Talepler -->
      <div v-else-if="requests.length > 0" class="space-y-4">
        <div
          v-for="request in requests"
          :key="request.id"
          class="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
        >
          <div class="flex flex-col md:flex-row gap-6">
            <!-- İlan Fotoğrafı -->
            <div class="w-full md:w-48 h-48 rounded-lg overflow-hidden shrink-0">
              <img
                :src="request.listingPhotoUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'"
                :alt="request.listingTitle"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Talep Bilgileri -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-xl font-bold mb-1">{{ request.listingTitle }}</h3>
                  <p class="text-gray-600">Misafir: {{ request.guestName }}</p>
                  <p class="text-sm text-gray-500">{{ request.guestEmail }}</p>
                </div>
                <span 
                  :class="getStatusColor(request.status)"
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {{ getStatusText(request.status) }}
                </span>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p class="text-sm text-gray-500">Giriş</p>
                  <p class="font-semibold">{{ new Date(request.checkInDate).toLocaleDateString('tr-TR') }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Çıkış</p>
                  <p class="font-semibold">{{ new Date(request.checkOutDate).toLocaleDateString('tr-TR') }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Misafir</p>
                  <p class="font-semibold">{{ request.guests }} kişi</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Toplam Fiyat</p>
                  <p class="font-semibold text-primary">₺{{ request.totalPrice }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <p class="text-xs text-gray-400">
                    Talep: {{ new Date(request.createdAt).toLocaleDateString('tr-TR') }}
                    <span v-if="request.responsedAt"> · Cevap: {{ new Date(request.responsedAt).toLocaleDateString('tr-TR') }}</span>
                  </p>
                  
                  <!-- Ödeme Durumu Badge -->
                  <span
                    v-if="request.isPaid"
                    class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1"
                  >
                    <i class="material-icons text-sm">check_circle</i>
                    Ödeme Alındı
                  </span>
                  <span
                    v-else-if="request.status === 'Approved' && isFutureReservation(request)"
                    class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1"
                  >
                    <i class="material-icons text-sm">schedule</i>
                    Ödeme Bekleniyor
                  </span>
                </div>
                <div v-if="request.status === 'Pending'" class="flex gap-2">
                  <button
                    @click="rejectRequest(request.id)"
                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <i class="material-icons text-sm">close</i>
                    Reddet
                  </button>
                  <button
                    @click="approveRequest(request.id)"
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <i class="material-icons text-sm">check</i>
                    Onayla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Boş durum -->
      <div v-else class="text-center py-20">
        <i class="material-icons text-gray-300 text-8xl mb-4">inbox</i>
        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Henüz rezervasyon talebi yok</h2>
        <p class="text-gray-500 mb-6">İlanlarınıza gelen rezervasyon talepleri burada görünecek</p>
        <router-link to="/my-listings" class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          İlanlarımı Görüntüle
        </router-link>
      </div>
    </div>
  </div>
</template>
