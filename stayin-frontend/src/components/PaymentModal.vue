<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { paymentAPI } from '@/services/api';

const props = defineProps({
  reservation: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'payment-success']);

const toast = useToast();

// Form fields
const cardNumber = ref('');
const cardHolder = ref('');
const expiryMonth = ref('');
const expiryYear = ref('');
const cvv = ref('');
const isProcessing = ref(false);

// Kart numarası formatla (4'lü gruplar)
const formatCardNumber = (value) => {
  const cleaned = value.replace(/\s/g, '');
  const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  return formatted.substring(0, 19); // Max 16 digit + 3 space
};

const handleCardNumberInput = (e) => {
  const value = e.target.value.replace(/\D/g, ''); // Sadece rakamlar
  cardNumber.value = formatCardNumber(value);
};

// Validasyonlar
const validateCardNumber = () => {
  const cleaned = cardNumber.value.replace(/\s/g, '');
  if (cleaned.length !== 16) {
    toast.add({
      severity: 'warn',
      summary: 'Hata',
      detail: 'Kart numarası 16 haneli olmalıdır',
      life: 3000
    });
    return false;
  }
  return true;
};

const validateExpiry = () => {
  if (!expiryMonth.value || !expiryYear.value) {
    toast.add({
      severity: 'warn',
      summary: 'Hata',
      detail: 'Son kullanma tarihini girin',
      life: 3000
    });
    return false;
  }
  
  const month = parseInt(expiryMonth.value);
  if (month < 1 || month > 12) {
    toast.add({
      severity: 'warn',
      summary: 'Hata',
      detail: 'Geçersiz ay',
      life: 3000
    });
    return false;
  }
  
  return true;
};

const validateCVV = () => {
  if (cvv.value.length !== 3) {
    toast.add({
      severity: 'warn',
      summary: 'Hata',
      detail: 'CVV 3 haneli olmalıdır',
      life: 3000
    });
    return false;
  }
  return true;
};

// Ödeme işlemi
const processPayment = async () => {
  // Validasyonlar
  if (!cardHolder.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Hata',
      detail: 'Kart üzerindeki ismi girin',
      life: 3000
    });
    return;
  }

  if (!validateCardNumber() || !validateExpiry() || !validateCVV()) {
    return;
  }

  isProcessing.value = true;

  try {
    // Fake işlem bekleme (gerçekçi olsun diye)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Backend'e ödeme bilgilerini gönder
    const paymentData = {
      cardNumber: cardNumber.value.replace(/\s/g, ''),
      cardHolder: cardHolder.value,
      expiryMonth: expiryMonth.value,
      expiryYear: '20' + expiryYear.value, // Backend 4 haneli yıl bekliyor (YYYY)
      cvv: cvv.value,
      amount: props.reservation.totalPrice
    };

    const response = await paymentAPI.processPayment(props.reservation.id, paymentData);

    if (response.data.success) {
      toast.add({
        severity: 'success',
        summary: 'Ödeme Başarılı!',
        detail: response.data.message || 'Rezervasyonunuz onaylandı',
        life: 5000
      });

      emit('payment-success');
      emit('close');
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ödeme Başarısız',
      detail: error.response?.data?.message || 'Ödeme işlemi sırasında bir hata oluştu',
      life: 5000
    });
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <Toast />
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
        <h2 class="text-2xl font-bold text-gray-900">Ödeme</h2>
        <button
          @click="emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
          :disabled="isProcessing"
        >
          <i class="material-icons text-3xl">close</i>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Rezervasyon Özeti -->
        <div class="bg-gray-50 rounded-xl p-4">
          <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="material-icons text-primary">receipt</i>
            Rezervasyon Özeti
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">İlan:</span>
              <span class="font-semibold">{{ reservation.listingTitle }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Giriş - Çıkış:</span>
              <span class="font-semibold">
                {{ new Date(reservation.checkInDate).toLocaleDateString('tr-TR') }} - 
                {{ new Date(reservation.checkOutDate).toLocaleDateString('tr-TR') }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Misafir:</span>
              <span class="font-semibold">{{ reservation.guests }} kişi</span>
            </div>
            <div class="border-t border-gray-200 pt-2 mt-2 flex justify-between">
              <span class="font-bold text-gray-900">Toplam Tutar:</span>
              <span class="font-bold text-primary text-xl">₺{{ reservation.totalPrice }}</span>
            </div>
          </div>
        </div>

        <!-- Kredi Kartı Formu -->
        <div class="space-y-4">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <i class="material-icons text-primary">credit_card</i>
            Kart Bilgileri
          </h3>

          <!-- Kart Numarası -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Kart Numarası</label>
            <input
              :value="cardNumber"
              @input="handleCardNumberInput"
              type="text"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-lg"
              :disabled="isProcessing"
            />
          </div>

          <!-- Kart Sahibi -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Kart Üzerindeki İsim</label>
            <input
              v-model="cardHolder"
              type="text"
              placeholder="AD SOYAD"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors uppercase"
              :disabled="isProcessing"
            />
          </div>

          <!-- Son Kullanma ve CVV -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Son Kullanma Tarihi</label>
              <div class="flex gap-2">
                <input
                  v-model="expiryMonth"
                  type="text"
                  placeholder="MM"
                  maxlength="2"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-center font-mono"
                  :disabled="isProcessing"
                />
                <span class="text-2xl text-gray-400 self-center">/</span>
                <input
                  v-model="expiryYear"
                  type="text"
                  placeholder="YY"
                  maxlength="2"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-center font-mono"
                  :disabled="isProcessing"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
              <input
                v-model="cvv"
                type="password"
                placeholder="123"
                maxlength="3"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-center font-mono"
                :disabled="isProcessing"
              />
            </div>
          </div>

          <!-- Güvenlik Notu -->
          <div class="flex items-start gap-3 bg-blue-50 p-4 rounded-xl">
            <i class="material-icons text-blue-600">lock</i>
            <p class="text-sm text-blue-800">
              Tüm ödeme bilgileriniz güvenli bir şekilde şifrelenir. 
              Kart bilgileriniz saklanmaz.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl border-t border-gray-200">
        <button
          @click="emit('close')"
          class="flex-1 py-3 px-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          :disabled="isProcessing"
        >
          İptal
        </button>
        <button
          @click="processPayment"
          class="flex-1 py-3 px-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
          :disabled="isProcessing"
        >
          <i v-if="!isProcessing" class="material-icons text-lg">payment</i>
          <span v-if="isProcessing" class="animate-pulse">İşleniyor...</span>
          <span v-else>₺{{ reservation.totalPrice }} Öde</span>
        </button>
      </div>
    </div>
  </div>
</template>
