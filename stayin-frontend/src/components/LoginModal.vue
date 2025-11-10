<script setup>
import { ref } from 'vue';
import api from "@/services/api.js";

const props = defineProps({
    isOpen: Boolean,
    errorMessage: String
})

const emit = defineEmits(['close', 'login-success', 'switch-to-register', 'switch-to-forgot-password'])

// Reactive variables
const email = ref('')
const password = ref('')
const error = ref("");

const closeModal = () => {
    email.value = '';
    password.value = '';
    emit('close')
}

const handleLogin = async () => {
  error.value = "";
  try {
    const res = await api.post("/Auth/login", {
      email: email.value,
      password: password.value
    });
    // Başarılı login: token ve user'ı kaydet
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    // Parent'a haber ver
    emit('login-success', res.data.user);
    // Formu sıfırla ve modalı kapat
    closeModal();
  } catch (err) {
    error.value = "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";
  }
}

const switchToRegister = () => {
    emit('switch-to-register')
}

const switchToForgotPassword = () => {
    emit('switch-to-forgot-password')
}
</script>


<template>
  <!-- Modal Overlay (arka plan) -->
  <div v-if="props.isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <!-- Modal Pencere -->
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <h2 class="text-xl font-bold mb-4">Giriş Yap</h2>      
        <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary transition-all">×</button>
        
        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
         <p class="mb-2 text-sm font-medium text-gray-700">E-posta</p>
        <input v-model="email" type="email" placeholder="Email adresinizi girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>

         <p class="mb-2 text-sm font-medium text-gray-700">Şifre</p>
        <input v-model="password" type="password" placeholder="Şifrenizi girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>
          <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
        <button type="submit" class="bg-primary hover:bg-primary-hover text-white text-sm rounded-lg py-2 px-4 w-full transition mb-4">Giriş Yap</button>
        </form>

        <div class="flex flex-col">
          <div class="flex flex-row items-center py-1">
            <a @click="switchToForgotPassword" class="text-primary hover:text-primary-hover text-sm cursor-pointer">Şifreni mi unuttun?</a>
          </div>

          <div class="flex flex-row items-center py-1">
            <span class="text-sm text-gray-600">Hesabınız yok mu?</span>
            <a @click="switchToRegister" class="text-primary hover:text-primary-hover text-sm cursor-pointer px-1">Kayıt ol</a>
          </div>
        </div>

    </div>
  </div>
</template>

