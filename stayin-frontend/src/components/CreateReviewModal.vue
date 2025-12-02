<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { reviewAPI } from '@/services/api';

const props = defineProps({
  reservation: {
    type: Object,
    required: true
  },
  existingReview: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'review-submitted']);

const toast = useToast();

// Form fields
const rating = ref(props.existingReview?.rating || 0);
const comment = ref(props.existingReview?.comment || '');
const hoveredStar = ref(0);
const isSubmitting = ref(false);

const isEditMode = !!props.existingReview;

const setRating = (value) => {
  rating.value = value;
};

const handleSubmit = async () => {
  // Validasyon
  if (rating.value === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Lütfen bir puan seçin',
      life: 3000
    });
    return;
  }

  if (!comment.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Lütfen yorum yazın',
      life: 3000
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const data = {
      reservationId: props.reservation.id,
      rating: rating.value,
      comment: comment.value.trim()
    };

    let response;
    if (isEditMode) {
      response = await reviewAPI.updateReview(props.existingReview.id, data);
    } else {
      response = await reviewAPI.createReview(data);
    }

    if (response.data.success) {
      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: response.data.message,
        life: 3000
      });
      emit('review-submitted');
      emit('close');
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.response?.data?.message || 'İşlem sırasında bir hata oluştu',
      life: 3000
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Toast />
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ isEditMode ? 'Yorumu Düzenle' : 'Yorum Yap' }}
        </h2>
        <button
          @click="emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i class="material-icons text-3xl">close</i>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Rezervasyon Bilgisi -->
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <i class="material-icons text-primary">home</i>
            <div>
              <p class="font-semibold text-gray-900">{{ reservation.listingTitle }}</p>
              <p class="text-sm text-gray-600">
                {{ new Date(reservation.checkInDate).toLocaleDateString('tr-TR') }} - 
                {{ new Date(reservation.checkOutDate).toLocaleDateString('tr-TR') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Yıldız Puanlama -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-3">Puanınız</label>
          <div class="flex items-center gap-2">
            <button
              v-for="star in 5"
              :key="star"
              @click="setRating(star)"
              @mouseenter="hoveredStar = star"
              @mouseleave="hoveredStar = 0"
              class="transition-all transform hover:scale-110"
              type="button"
            >
              <i 
                class="material-icons text-5xl"
                :class="star <= (hoveredStar || rating) ? 'text-yellow-400' : 'text-gray-300'"
              >
                {{ star <= (hoveredStar || rating) ? 'star' : 'star_border' }}
              </i>
            </button>
            <span v-if="rating > 0" class="ml-3 text-lg font-semibold text-gray-700">
              {{ rating }}/5
            </span>
          </div>
        </div>

        <!-- Yorum Alanı -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Yorumunuz</label>
          <textarea
            v-model="comment"
            rows="6"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Deneyiminizi paylaşın..."
            :disabled="isSubmitting"
          ></textarea>
          <p class="text-sm text-gray-500 mt-2">{{ comment.length }} karakter</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl border-t border-gray-200">
        <button
          @click="emit('close')"
          class="flex-1 py-3 px-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          :disabled="isSubmitting"
        >
          İptal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 py-3 px-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
          :disabled="isSubmitting"
        >
          <i v-if="!isSubmitting" class="material-icons text-lg">{{ isEditMode ? 'edit' : 'send' }}</i>
          <span v-if="isSubmitting" class="animate-spin">⏳</span>
          {{ isSubmitting ? 'Gönderiliyor...' : (isEditMode ? 'Güncelle' : 'Gönder') }}
        </button>
      </div>
    </div>
  </div>
</template>
