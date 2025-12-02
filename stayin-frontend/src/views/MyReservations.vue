<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { reservationAPI, reviewAPI, paymentAPI } from '@/services/api.js';
import { user, checkAuth } from '@/stores/userStore';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import CreateReviewModal from '@/components/CreateReviewModal.vue';
import PaymentModal from '@/components/PaymentModal.vue';

const router = useRouter();
const toast = useToast();
const reservations = ref([]);
const isLoading = ref(true);
const showReviewModal = ref(false);
const selectedReservation = ref(null);
const myReviews = ref([]);
const existingReview = ref(null);
const showPaymentModal = ref(false);
const selectedPaymentReservation = ref(null);

onMounted(async () => {
  checkAuth();
  if (!user.value) {
    router.push('/');
    return;
  }
  await loadReservations();
  await loadMyReviews();
});

const loadReservations = async () => {
  try {
    isLoading.value = true;
    const response = await reservationAPI.getMyReservations();
    // Backend'den gelen PascalCase verileri camelCase'e çevir
    const data = response.data?.reservations || response.data || [];
    const mappedReservations = Array.isArray(data) ? data.map(r => ({
      id: r.Id || r.id,
      listingTitle: r.ListingTitle || r.listingTitle,
      listingPhotoUrl: r.ListingPhotoUrl || r.listingPhotoUrl,
      hostName: r.HostName || r.hostName,
      checkInDate: r.CheckInDate || r.checkInDate,
      checkOutDate: r.CheckOutDate || r.checkOutDate,
      guests: r.Guests || r.guests,
      totalPrice: r.TotalPrice || r.totalPrice,
      status: r.Status || r.status,
      createdAt: r.CreatedAt || r.createdAt,
      isPaid: r.IsPaid || r.isPaid || false,
      paymentDate: r.PaymentDate || r.paymentDate
    })) : [];
    
    // Her rezervasyon için ödeme bilgisini backend'den çek
    for (const reservation of mappedReservations) {
      try {
        const paymentResponse = await paymentAPI.getPaymentByReservation(reservation.id);
        if (paymentResponse.data.success && paymentResponse.data.data) {
          reservation.isPaid = true;
          reservation.paymentDate = paymentResponse.data.data.paymentDate;
          reservation.transactionId = paymentResponse.data.data.transactionId;
        }
      } catch (error) {
        // Ödeme bulunamadıysa (404) normal, hata vermeden devam et
        if (error.response?.status !== 404) {
          console.error(`Reservation ${reservation.id} için ödeme bilgisi alınamadı:`, error);
        }
      }
    }
    
    reservations.value = mappedReservations;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Rezervasyonlar yüklenemedi',
      life: 3000
    });
  } finally {
    isLoading.value = false;
  }
};

// Kullanıcının yaptığı yorumları yükle
const loadMyReviews = async () => {
  try {
    const response = await reviewAPI.getMyReviews();
    if (response.data.success) {
      myReviews.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Yorumlar yüklenirken hata:', error);
  }
};

// Rezervasyon için yorum yapılmış mı kontrol et
const hasReview = (reservationId) => {
  return myReviews.value.some(r => r.reservationId === reservationId);
};

// Rezervasyonun yorumunu getir
const getReservationReview = (reservationId) => {
  return myReviews.value.find(r => r.reservationId === reservationId);
};

// Rezervasyon tamamlanmış mı (check-out tarihi geçmiş mi)
const isCompleted = (reservation) => {
  return reservation.status === 'Approved' && 
         new Date(reservation.checkOutDate) < new Date();
};

// Rezervasyon gelecekte mi (ödeme gerekli mi)
const isFutureReservation = (reservation) => {
  return new Date(reservation.checkInDate) > new Date();
};

// Yorum modalını aç
const openReviewModal = (reservation) => {
  selectedReservation.value = reservation;
  existingReview.value = getReservationReview(reservation.id);
  showReviewModal.value = true;
};

// Yorum gönderildiğinde
const handleReviewSubmitted = async () => {
  await loadMyReviews();
  showReviewModal.value = false;
};

// Ödeme modalını aç
const openPaymentModal = (reservation) => {
  selectedPaymentReservation.value = reservation;
  showPaymentModal.value = true;
};

// Ödeme başarılı olduğunda
const handlePaymentSuccess = async () => {
  showPaymentModal.value = false;
  
  // UI'ı hemen güncelle
  if (selectedPaymentReservation.value) {
    const index = reservations.value.findIndex(r => r.id === selectedPaymentReservation.value.id);
    if (index !== -1) {
      reservations.value[index].isPaid = true;
      reservations.value[index].paymentDate = new Date().toISOString();
    }
  }
  
  // Backend'den güncel veriyi de çek
  await loadReservations();
  
  toast.add({
    severity: 'success',
    summary: 'Başarılı',
    detail: 'Ödemeniz alındı, iyi tatiller!',
    life: 5000
  });
};

const cancelReservation = async (reservationId) => {
  if (!confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) {
    return;
  }
  
  try {
    await reservationAPI.cancelReservation(reservationId);
    toast.add({
      severity: 'success',
      summary: 'Başarılı',
      detail: 'Rezervasyon iptal edildi',
      life: 3000
    });
    await loadReservations();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.response?.data?.message || 'Rezervasyon iptal edilemedi',
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
        <i class="material-icons text-4xl text-primary">event</i>
        <h1 class="text-3xl font-bold">Rezervasyonlarım</h1>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-500">Rezervasyonlar yükleniyor...</p>
      </div>

      <!-- Rezervasyonlar -->
      <div v-else-if="reservations.length > 0" class="space-y-4">
        <div
          v-for="reservation in reservations"
          :key="reservation.Id"
          class="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
        >
          <div class="flex flex-col md:flex-row gap-6">
            <!-- İlan Fotoğrafı -->
            <div class="w-full md:w-48 h-48 rounded-lg overflow-hidden shrink-0">
              <img
              :src="reservation.listingPhotoUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'"
              :alt="reservation.listingTitle"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Rezervasyon Bilgileri -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold mb-1">{{ reservation.listingTitle }}</h3>
                <p class="text-gray-600">Ev Sahibi: {{ reservation.hostName }}</p>
                </div>
                <span 
                  :class="getStatusColor(reservation.status)"
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {{ getStatusText(reservation.status) }}
                </span>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p class="text-sm text-gray-500">Giriş</p>
                  <p class="font-semibold">{{ new Date(reservation.checkInDate).toLocaleDateString('tr-TR') }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Çıkış</p>
                  <p class="font-semibold">{{ new Date(reservation.checkOutDate).toLocaleDateString('tr-TR') }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Misafir</p>
                  <p class="font-semibold">{{ reservation.guests }} kişi</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Toplam Fiyat</p>
                  <p class="font-semibold text-primary">₺{{ reservation.totalPrice }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <p class="text-xs text-gray-400">
                    Talep: {{ new Date(reservation.createdAt).toLocaleDateString('tr-TR') }}
                    <span v-if="reservation.responsedAt"> · Cevap: {{ new Date(reservation.responsedAt).toLocaleDateString('tr-TR') }}</span>
                  </p>
                  
                  <!-- Ödeme Durumu Badge -->
                  <span
                    v-if="reservation.isPaid"
                    class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1"
                  >
                    <i class="material-icons text-sm">check_circle</i>
                    Ödendi
                  </span>
                  <span
                    v-else-if="reservation.status === 'Approved' && isFutureReservation(reservation)"
                    class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1"
                  >
                    <i class="material-icons text-sm">schedule</i>
                    Ödeme Bekliyor
                  </span>
                </div>
                
                <div class="flex gap-3">
                  <!-- Ödeme Yap Butonu (Gelecekteki onaylanmış ama ödenmemiş rezervasyonlar) -->
                  <button
                    v-if="reservation.status === 'Approved' && !reservation.isPaid && isFutureReservation(reservation)"
                    @click="openPaymentModal(reservation)"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <i class="material-icons text-sm">payment</i>
                    Ödeme Yap
                  </button>
                  
                  <!-- İptal Butonu (Sadece gelecekteki rezervasyonlar için) -->
                  <button
                    v-if="(reservation.status === 'Pending' || reservation.status === 'Approved') && !reservation.isPaid && isFutureReservation(reservation)"
                    @click="cancelReservation(reservation.id)"
                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <i class="material-icons text-sm">close</i>
                    İptal Et
                  </button>
                  
                  <!-- Yorum Yap/Düzenle Butonu (Sadece tamamlanmış rezervasyonlar için) -->
                  <button
                    v-if="isCompleted(reservation)"
                    @click="openReviewModal(reservation)"
                    :class="hasReview(reservation.id) 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-primary hover:bg-primary/90'"
                    class="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <i class="material-icons text-sm">{{ hasReview(reservation.id) ? 'edit' : 'rate_review' }}</i>
                    {{ hasReview(reservation.id) ? 'Yorumu Düzenle' : 'Yorum Yap' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Boş durum -->
      <div v-else class="text-center py-20">
        <i class="material-icons text-gray-300 text-8xl mb-4">event_busy</i>
        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Henüz rezervasyonunuz yok</h2>
        <p class="text-gray-500 mb-6">İlanları keşfedin ve ilk rezervasyonunuzu yapın</p>
        <router-link to="/" class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          İlanları Keşfet
        </router-link>
      </div>
    </div>

    <!-- Review Modal -->
    <CreateReviewModal
      v-if="showReviewModal && selectedReservation"
      :reservation="selectedReservation"
      :existingReview="existingReview"
      @close="showReviewModal = false"
      @review-submitted="handleReviewSubmitted"
    />

    <!-- Payment Modal -->
    <PaymentModal
      v-if="showPaymentModal && selectedPaymentReservation"
      :reservation="selectedPaymentReservation"
      @close="showPaymentModal = false"
      @payment-success="handlePaymentSuccess"
    />
  </div>
</template>
