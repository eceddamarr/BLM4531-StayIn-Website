<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import api from "@/services/api.js";
import InputOtp from 'primevue/inputotp';


const toast = useToast();

const props = defineProps({
    isOpen: Boolean,
})

const emit = defineEmits(['close', 'forgot-password-success', 'switch-to-login', 'switch-to-forgot-password'])

// Reactive variables
const email = ref('')
const error = ref('')
const isCodeSent = ref(false);
const isCodeVerified = ref(false);
const verificationCode = ref('');
const newPassword = ref('');
const newPasswordRepeat = ref('');

const closeModal = () => {
    email.value = '';
    error.value = '';
    isCodeSent.value = false;
    isCodeVerified.value = false;
    verificationCode.value = '';
    newPassword.value = '';
    newPasswordRepeat.value = '';
    emit('close')
}

const handleForgotPassword = async () => {
    error.value = "";
    verificationCode.value = '';
    try {
        const res = await api.post("/Auth/forgot-password", {
            email: email.value
        });
        
        // Başarılı istek sonrası
        toast.add({ 
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Şifre yenileme kodu e-posta adresinize gönderildi.',

            life: 3000 

        });
      
    // İkinci ekrana geç 
    isCodeSent.value = true;

        
    } catch (err) {
        console.error("Forgot password hatası:", err);
        console.error("Response:", err.response?.data);
        
        if (err.response && err.response.data && err.response.data.message) {
            error.value = err.response.data.message;
        } else if (err.response && err.response.data) {
            error.value = JSON.stringify(err.response.data);
        } else {
            error.value = "İstek başarısız. Lütfen tekrar deneyin.";
        }
    }
}

const switchToLogin = () => {
    isCodeSent.value = false;
    emit('switch-to-login')
}

const handleVerifyCode = async () => {
    error.value = "";
    try {
        const res = await api.post("/Auth/verify-code", {
            email: email.value,
            code: verificationCode.value
        });
        
        toast.add({ 
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Kod doğrulandı. Şimdi yeni şifrenizi belirleyin.',
            life: 3000 
        });
        isCodeVerified.value = true;
    } catch (err) {
        console.error("Doğrulama hatası:", err);
        console.error("Response:", err.response?.data);
        if (err.response && err.response.data && err.response.data.message) {
            error.value = err.response.data.message;
        } else if (err.response && err.response.data) {
            error.value = JSON.stringify(err.response.data);
        } else {
            error.value = "Doğrulama başarısız. Lütfen tekrar deneyin.";
        }
    }
}

const handleResetPassword = async () => {
    error.value = "";
    if (!newPassword.value || !newPasswordRepeat.value) {
        error.value = "Lütfen tüm alanları doldurun.";
        return;
    }
    if (newPassword.value !== newPasswordRepeat.value) {
        error.value = "Şifreler eşleşmiyor.";
        return;
    }
    try {
        const res = await api.post("/Auth/reset-password", {
            email: email.value,
            code: verificationCode.value,
            newPassword: newPassword.value,
            newPasswordConfirm: newPasswordRepeat.value
        });
        toast.add({ 
            severity: 'success', 
            summary: 'Başarılı', 
            detail: 'Şifreniz başarıyla güncellendi.',
            life: 3000 
        });
        emit('forgot-password-success', email.value);
        closeModal();
    } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
            error.value = err.response.data.message;
        } else if (err.response && err.response.data) {
            error.value = JSON.stringify(err.response.data);
        } else {
            error.value = "Şifre güncelleme başarısız. Lütfen tekrar deneyin.";
        }
    }
}
</script>


<template>
  <Toast />
  <!-- Modal Overlay (arka plan) -->
  <div v-if="props.isOpen && !isCodeSent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <!-- Modal Pencere -->
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <h2 class="text-xl font-bold mb-4">Şifre Yenileme</h2>      
        <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary transition-all">×</button>
        
        <!-- Form -->
        <form @submit.prevent="handleForgotPassword">
        <p class="mb-2 text-sm font-medium text-gray-700">Email</p>
        <input v-model="email" type="email" placeholder="Email adresinizi girin" class="border border-gray-300 rounded-lg py-2 px-4 w-full mb-4 bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>

        <button type="submit" class="bg-primary hover:bg-primary-hover text-white text-sm rounded-lg py-2 px-4 w-full transition mb-4">Kod gönder</button>

        <div class="flex justify-center py-2">
          <a @click="switchToLogin" class="text-primary hover:text-primary-hover text-sm cursor-pointer px-1">Giriş ekranına geri dön</a>
        </div>
        </form>
    </div>
  </div>
    <div v-if="props.isOpen && isCodeSent && !isCodeVerified" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <!-- Modal Pencere -->
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
                <h2 class="text-xl font-bold mb-4">Şifre Yenileme Kodu Gönderildi</h2>      
                <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary transition-all">×</button>
        
        <p class="text-gray-700 mb-4">Şifre yenileme kodu <span class="font-semibold">{{ email }}</span> adresinize gönderildi. Lütfen e-postanızı kontrol edin.</p>
        
                <form @submit.prevent="handleVerifyCode" class="flex flex-col gap-4">
                        <div class="flex justify-center">
                                <InputOtp name="passcode" v-model="verificationCode" :length="6" />
                        </div>
                        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
                        <button type="submit" class="bg-primary hover:bg-primary-hover text-white text-sm rounded-lg py-2 px-4 w-full transition">Doğrula</button>
                </form>
                <div class="flex justify-center pt-3">
                    <a @click="handleForgotPassword" class="text-primary hover:text-primary-hover text-sm cursor-pointer px-1">Yeniden kod gönder</a>
                </div>
                <div class="flex justify-center py-2">
                    <a @click="switchToLogin" class="text-primary hover:text-primary-hover text-sm cursor-pointer px-1">Giriş ekranına geri dön</a>
                </div>
        </div>
    </div>

    <div v-if="props.isOpen && isCodeVerified" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <h2 class="text-xl font-bold mb-4">Yeni Şifre Belirle</h2>
            <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary transition-all">×</button>
            <form @submit.prevent="handleResetPassword" class="flex flex-col gap-4">
                <input v-model="newPassword" type="password" placeholder="Yeni şifre" class="border border-gray-300 rounded-lg py-2 px-4 w-full bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>
                <input v-model="newPasswordRepeat" type="password" placeholder="Yeni şifre (tekrar)" class="border border-gray-300 rounded-lg py-2 px-4 w-full bg-gray-50 focus:bg-white focus:border-primary outline-none transition" required>
                <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
                <button type="submit" class="bg-primary hover:bg-primary-hover text-white text-sm rounded-lg py-2 px-4 w-full transition">Şifreyi Güncelle</button>
            </form>
        </div>
    </div>
</template>

