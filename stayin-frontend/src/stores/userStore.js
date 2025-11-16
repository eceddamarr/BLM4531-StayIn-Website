import { ref, watch } from 'vue';

// Global user state (tüm componentlerde kullanılabilir)
export const user = ref(null);

// LocalStorage'dan user'ı yükle (uygulama başlangıcında)
export function initUser() {
  const storedUser = localStorage.getItem("user");
  
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      console.error('User parse hatası:', e);
      localStorage.removeItem("user");
    }
  }
}

// User login (token ve user'ı kaydet)
export function setUser(userData, token) {
  user.value = userData;
  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("token", token);
}

// User logout (token ve user'ı temizle)
export function clearUser() {
  user.value = null;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

// Token kontrolü (token varsa user'ı yükle)
export function checkAuth() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  
  if (token && storedUser) {
    try {
      user.value = JSON.parse(storedUser);
      return true;
    } catch (e) {
      clearUser();
      return false;
    }
  }
  clearUser();
  return false;
}

// User değişikliklerini localStorage'a otomatik kaydet
watch(user, (newUser) => {
  if (newUser) {
    localStorage.setItem("user", JSON.stringify(newUser));
  }
}, { deep: true });
