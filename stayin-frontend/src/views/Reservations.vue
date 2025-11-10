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
        <i class="material-icons text-4xl text-primary">event</i>
        <h1 class="text-3xl font-bold">Rezervasyonlarım</h1>
      </div>

      <!-- Boş durum -->
      <div class="text-center py-20">
        <i class="material-icons text-gray-300 text-8xl mb-4">event_available</i>
        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Henüz rezervasyonunuz yok</h2>
        <p class="text-gray-500 mb-6">Rezervasyon yaptığınızda burada görünecek</p>
        <router-link to="/" class="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          İlanları Keşfet
        </router-link>
      </div>
    </div>
  </div>
</template>
