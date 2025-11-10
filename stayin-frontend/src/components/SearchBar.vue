<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  listings: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search'])
const searchQuery = ref('')
const showSuggestions = ref(false)
const selectedIndex = ref(-1)

// Önerileri oluştur
const suggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }
  
  const query = searchQuery.value.toLowerCase()
  const uniqueSuggestions = new Set()
  
  props.listings.forEach(listing => {
    const city = listing.address?.addressCity || ''
    const country = listing.address?.addressCountry || ''
    const district = listing.address?.addressDistrict || ''
    const region = listing.address?.addressRegion || ''
    
    // Şehir önerisi
    if (city && city.toLowerCase().includes(query)) {
      uniqueSuggestions.add(JSON.stringify({ 
        type: 'city', 
        text: `${city}, ${country}`,
        value: city
      }))
    }
    
    // Ülke önerisi
    if (country && country.toLowerCase().includes(query)) {
      uniqueSuggestions.add(JSON.stringify({ 
        type: 'country', 
        text: country,
        value: country
      }))
    }
    
    // İlçe önerisi
    if (district && district.toLowerCase().includes(query)) {
      uniqueSuggestions.add(JSON.stringify({ 
        type: 'district', 
        text: `${district}, ${city}`,
        value: district
      }))
    }
    
    // Bölge önerisi
    if (region && region.toLowerCase().includes(query)) {
      uniqueSuggestions.add(JSON.stringify({ 
        type: 'region', 
        text: region,
        value: region
      }))
    }
  })
  
  return Array.from(uniqueSuggestions)
    .map(str => JSON.parse(str))
    .slice(0, 6) // Maksimum 6 öneri
})

// Öneri seçildiğinde
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.value
  showSuggestions.value = false
  handleSearch()
}

// Klavye navigasyonu
const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (showSuggestions.value && selectedIndex.value >= 0 && suggestions.value.length > 0) {
      // Öneri seçiliyse onu kullan
      selectSuggestion(suggestions.value[selectedIndex.value])
    } else {
      // Öneri seçili değilse direkt aramayı yap
      handleSearch()
    }
    return
  }
  
  if (!showSuggestions.value || suggestions.value.length === 0) return
  
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

const handleSearch = () => {
  showSuggestions.value = false
  emit('search', searchQuery.value)
}

// Input değiştiğinde önerileri göster
watch(searchQuery, (newVal) => {
  selectedIndex.value = -1
  showSuggestions.value = newVal.length >= 2
  
  // Eğer input boşaldıysa, arama sıfırla
  if (newVal === '') {
    emit('search', '')
  }
})

// Dışarı tıklanınca kapat
const handleClickOutside = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// Öneri tipi ikonu
const getIcon = (type) => {
  switch(type) {
    case 'city': return 'location_city'
    case 'country': return 'public'
    case 'district': return 'place'
    case 'region': return 'map'
    default: return 'location_on'
  }
}
</script>

<template>
  <div class="relative max-w-2xl mx-auto mt-10">
    <div
      class="flex items-center justify-between bg-white rounded-full shadow-lg px-6 py-3 border border-gray-200"
    >
      <!-- Arama İnput -->
      <div class="flex items-center flex-1 gap-3">
        <i class="material-icons text-gray-400">search</i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nereye gitmek istiyorsunuz?"
          class="outline-none text-base text-gray-700 placeholder-gray-400 w-full"
          @keydown="handleKeyDown"
          @blur="handleClickOutside"
          @focus="showSuggestions = searchQuery.length >= 2"
        />
      </div>

      <!-- Ara Butonu -->
      <button
        @click="handleSearch"
        class="bg-primary hover:bg-primary-hover text-white rounded-full p-3 shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
      >
        <i class="material-icons">search</i>
      </button>
    </div>

    <!-- Öneri Listesi -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @mousedown="selectSuggestion(suggestion)"
        :class="[
          'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
          selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
        ]"
      >
        <i class="material-icons text-gray-400 text-xl">{{ getIcon(suggestion.type) }}</i>
        <span class="text-gray-700">{{ suggestion.text }}</span>
      </div>
    </div>
  </div>
</template>
