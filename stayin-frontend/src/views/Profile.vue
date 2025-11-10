<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);

onMounted(() => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    router.push('/');
    return;
  }
  user.value = JSON.parse(storedUser);
});
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
        <i class="material-icons text-4xl text-primary">person</i>
        <h1 class="text-3xl font-bold">Profilim</h1>
      </div>

      <div v-if="user" class="bg-white rounded-xl shadow-md p-8 max-w-2xl">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
            <div class="text-lg">{{ user.fullName }}</div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
            <div class="text-lg">{{ user.email }}</div>
          </div>
          
          <div class="pt-4">
            <p class="text-gray-500 text-sm">Profil düzenleme özellikleri yakında eklenecek...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
