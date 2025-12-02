<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { user as globalUser } from '@/stores/userStore';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { profileAPI } from '@/services/api';

const router = useRouter();
const toast = useToast();

// Form fields
const fullName = ref('');
const email = ref('');
const phoneNumber = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

// Edit modes
const isEditingProfile = ref(false);
const isEditingPassword = ref(false);

onMounted(() => {
  if (!globalUser.value) {
    router.push('/');
    return;
  }
  // Global state'ten verileri yükle
  fullName.value = globalUser.value.fullName || '';
  email.value = globalUser.value.email || '';
  phoneNumber.value = globalUser.value.phoneNumber || '';
});

const saveProfile = async () => {
  // Validasyon
  if (!fullName.value || !email.value || !phoneNumber.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Lütfen tüm alanları doldurun',
      life: 3000
    });
    return;
  }

  try {
    const response = await profileAPI.updateProfile({
      fullName: fullName.value,
      email: email.value,
      phoneNumber: phoneNumber.value
    });

    if (response.data.success) {
      // Global state'i güncelle
      globalUser.value = {
        ...globalUser.value,
        fullName: response.data.user.fullName,
        email: response.data.user.email,
        phoneNumber: response.data.user.phoneNumber
      };

      // localStorage'ı güncelle
      localStorage.setItem('user', JSON.stringify(globalUser.value));

      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: response.data.message,
        life: 3000
      });
      
      isEditingProfile.value = false;
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.response?.data?.message || 'Profil güncellenirken bir hata oluştu',
      life: 3000
    });
  }
};

const cancelProfileEdit = () => {
  // Orijinal değerlere geri dön
  fullName.value = globalUser.value.fullName || '';
  email.value = globalUser.value.email || '';
  phoneNumber.value = globalUser.value.phoneNumber || '';
  isEditingProfile.value = false;
};

const changePassword = async () => {
  // Validasyon
  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Lütfen tüm şifre alanlarını doldurun',
      life: 3000
    });
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Yeni şifreler eşleşmiyor',
      life: 3000
    });
    return;
  }

  if (newPassword.value.length < 6) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Şifre en az 6 karakter olmalı',
      life: 3000
    });
    return;
  }

  try {
    const response = await profileAPI.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value
    });

    if (response.data.success) {
      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: response.data.message,
        life: 3000
      });
      
      // Şifre alanlarını temizle
      currentPassword.value = '';
      newPassword.value = '';
      confirmNewPassword.value = '';
      isEditingPassword.value = false;
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu',
      life: 3000
    });
  }
};

const cancelPasswordEdit = () => {
  currentPassword.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
  isEditingPassword.value = false;
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
    <div class="max-w-4xl mx-auto px-8 py-10">
      <div class="flex items-center gap-3 mb-8">
        <i class="material-icons text-4xl text-primary">person</i>
        <h1 class="text-3xl font-bold">Profilim</h1>
      </div>

      <div v-if="globalUser" class="space-y-6">
        <!-- Profil Bilgileri Kartı -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <!-- Header - Always Visible -->
          <div class="bg-linear-to-r from-primary to-primary/80 p-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <i class="material-icons text-4xl text-primary">person</i>
              </div>
              <div class="text-white">
                <h2 class="text-2xl font-bold">{{ fullName }}</h2>
                <p class="text-white/80 text-sm">{{ email }}</p>
              </div>
            </div>
          </div>

          <!-- Content - Editable Fields -->
          <div class="p-6">
            <div v-if="!isEditingProfile" class="space-y-6">
              <!-- Display Mode -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <i class="material-icons text-primary">person_outline</i>
                  <div>
                    <p class="text-xs text-gray-500 uppercase font-medium">Ad Soyad</p>
                    <p class="text-gray-900 font-medium">{{ fullName }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <i class="material-icons text-primary">email</i>
                  <div>
                    <p class="text-xs text-gray-500 uppercase font-medium">E-posta</p>
                    <p class="text-gray-900 font-medium">{{ email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <i class="material-icons text-primary">phone</i>
                  <div>
                    <p class="text-xs text-gray-500 uppercase font-medium">Telefon</p>
                    <p class="text-gray-900 font-medium">{{ phoneNumber }}</p>
                  </div>
                </div>
              </div>
              <button
                @click="isEditingProfile = true"
                class="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <i class="material-icons text-lg">edit</i>
                Profili Düzenle
              </button>
            </div>

            <div v-else class="space-y-4">
              <!-- Edit Mode -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Ad Soyad</label>
                <input
                  v-model="fullName"
                  type="text"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ad soyadınızı girin"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">E-posta</label>
                <input
                  v-model="email"
                  type="email"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                  placeholder="Email adresinizi girin"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Telefon Numarası</label>
                <input
                  v-model="phoneNumber"
                  type="tel"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  @click="saveProfile"
                  class="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <i class="material-icons text-lg">check</i>
                  Kaydet
                </button>
                <button
                  @click="cancelProfileEdit"
                  class="flex-1 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <i class="material-icons text-lg">close</i>
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Şifre Değiştirme - Collapsible -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <button
            @click="isEditingPassword = !isEditingPassword"
            class="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <i class="material-icons text-primary">lock</i>
              </div>
              <div class="text-left">
                <h3 class="text-lg font-semibold text-gray-900">Şifre Değiştir</h3>
                <p class="text-sm text-gray-500">Hesap şifrenizi güncelleyin</p>
              </div>
            </div>
            <i class="material-icons text-gray-400 transition-transform" :class="{ 'rotate-180': isEditingPassword }">
              expand_more
            </i>
          </button>

          <!-- Expanded Content -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[600px] opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="max-h-[600px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="isEditingPassword" class="px-6 pb-6 border-t border-gray-100">
              <div class="space-y-4 pt-6">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Mevcut Şifre</label>
                  <input
                    v-model="currentPassword"
                    type="password"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Yeni Şifre</label>
                  <input
                    v-model="newPassword"
                    type="password"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                    placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                  <input
                    v-model="confirmNewPassword"
                    type="password"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
                <div class="flex gap-3 pt-2">
                  <button
                    @click="changePassword"
                    class="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <i class="material-icons text-lg">check</i>
                    Şifreyi Değiştir
                  </button>
                  <button
                    @click="cancelPasswordEdit"
                    class="flex-1 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <i class="material-icons text-lg">close</i>
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>
