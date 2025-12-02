<script setup>
import { ref } from 'vue';
import api from "@/services/api.js";
import { setUser } from '@/stores/userStore';

const props = defineProps({
    isOpen: Boolean,
    errorMessage: String
})

const emit = defineEmits(['close', 'register-success', 'switch-to-login'])

// Reactive variables
const fullName = ref('')
const email = ref('')
const phoneNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const closeModal = () => {
    fullName.value = '';
    email.value = '';
    phoneNumber.value = '';
    password.value = '';
    confirmPassword.value = '';
    error.value = '';
    emit('close')
}

const handleRegister = async () => {
  error.value = "";
  try {
    const res = await api.post("/Auth/register", {
      fullName: fullName.value,
      email: email.value,
      phoneNumber: phoneNumber.value.replace(/\s/g, ''), // Boşlukları temizle
      password: password.value,
      passwordConfirm: confirmPassword.value
    });
    // Global state'i güncelle (otomatik olarak localStorage'a kaydeder)
    setUser(res.data.user, res.data.token);
    // Parent'a haber ver
    emit('register-success', res.data.user);
    // Sadece modalı kapat
    closeModal();
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message;
    } else if (err.response && err.response.data) {
      error.value = JSON.stringify(err.response.data);
    } else {
      error.value = "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.";
    }
  }
}

const switchToLogin = () => {
    emit('switch-to-login')
}
</script>


<template>
  <!-- Modal Overlay (arka plan) -->
  <div v-if="props.isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <!-- Modal Pencere -->
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <h2 class="text-xl font-bold mb-4">Kayıt Ol</h2>      
        <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary transition-all">×</button>
        
        <!-- Register Form -->
        <form @submit.prevent="handleRegister">
         <p class="mb-2 text-sm font-medium text-gray-700">Ad Soyad</p>
         <input v-model="fullName" type="text" placeholder="Ad soyadınızı girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>

         <p class="mb-2 text-sm font-medium text-gray-700">E-posta</p>
        <input v-model="email" type="email" placeholder="Email adresinizi girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>

         <p class="mb-2 text-sm font-medium text-gray-700">Telefon Numarası</p>
        <input 
          v-model="phoneNumber" 
          type="tel" 
          placeholder="05XX XXX XX XX" 
          class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" 
          required 
          pattern="[0-9\s]{13,14}"
          title="Lütfen geçerli bir telefon numarası girin (örn: 05XX XXX XX XX)"
        >

         <p class="mb-2 text-sm font-medium text-gray-700">Şifre</p>
        <input v-model="password" type="password" placeholder="Şifrenizi girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>

         <p class="mb-2 text-sm font-medium text-gray-700">Şifre Tekrarı</p>
        <input v-model="confirmPassword" type="password" placeholder="Şifrenizi tekrar girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>

        <button type="submit" class="bg-primary hover:bg-primary-hover text-white text-sm rounded-lg py-2 px-4 w-full transition mb-4">Kayıt Ol</button>
        </form>

        <div class="flex flex-row items-center py-1">
          <h4 class="p-1 text-sm ">Zaten hesabın var mı?</h4>
          <a @click="switchToLogin" class="text-primary hover:text-primary-hover text-sm cursor-pointer">Giriş yap</a>
        </div>

    </div>
  </div>
</template>

