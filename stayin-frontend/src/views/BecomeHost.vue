<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import LoginModal from '../components/LoginModal.vue';
import InputNumber from 'primevue/inputnumber';
import FileUpload from 'primevue/fileupload';
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import { myListingsAPI } from '@/services/api.js';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const currentStep = ref(0);
const steps = Array(10).fill({ label: '' });

const isLoginModalOpen = ref(false);
const user = ref(null);
const loginError = ref("");

// Edit mode kontrolü
const editMode = ref(false);
const editingListingId = ref(null);

// Kullanıcı kontrolü
if (!localStorage.getItem("user")) {
  isLoginModalOpen.value = true;
} else {
  user.value = JSON.parse(localStorage.getItem("user"));
}

// Sayfa yüklendiğinde edit mode kontrolü
onMounted(async () => {
  const editId = route.query.edit;
  if (editId) {
    editMode.value = true;
    editingListingId.value = parseInt(editId);
    await loadListingForEdit(editingListingId.value);
  }
});

// İlan verilerini yükle (edit için)
async function loadListingForEdit(listingId) {
  try {
    toast.add({
      severity: 'info',
      summary: 'Yükleniyor...',
      detail: 'İlan verileri yükleniyor',
      life: 2000
    });
    
    const response = await myListingsAPI.getMyListings();
    const listings = response.data?.listings || [];
    const listing = listings.find(l => (l.Id || l.id) === listingId);
    
    if (!listing) {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'İlan bulunamadı',
        life: 3000
      });
      router.push('/my-listings');
      return;
    }
    
    // Tüm form alanlarını doldur
    selectedPlace.value = listing.PlaceType || listing.placeType;
    selectedAccommodation.value = listing.AccommodationType || listing.accommodationType;
    guests.value = listing.Guests || listing.guests || 2;
    bedrooms.value = listing.Bedrooms || listing.bedrooms || 1;
    beds.value = listing.Beds || listing.beds || 1;
    bathrooms.value = listing.Bathrooms || listing.bathrooms || 1;
    title.value = listing.Title || listing.title || '';
    description.value = listing.Description || listing.description || '';
    price.value = listing.Price || listing.price || '';
    
    // Adres bilgileri
    const addr = listing.Address || listing.address || {};
    addressCountry.value = addr.AddressCountry || addr.addressCountry || '';
    addressCity.value = addr.AddressCity || addr.addressCity || '';
    addressDistrict.value = addr.AddressDistrict || addr.addressDistrict || '';
    addressStreet.value = addr.AddressStreet || addr.addressStreet || '';
    addressBuilding.value = addr.AddressBuilding || addr.addressBuilding || '';
    addressPostalCode.value = addr.AddressPostalCode || addr.addressPostalCode || '';
    addressRegion.value = addr.AddressRegion || addr.addressRegion || '';
    
    // Koordinatlar
    latitude.value = listing.Latitude || listing.latitude || 39.9334;
    longitude.value = listing.Longitude || listing.longitude || 32.8597;
    markerPosition.value = [latitude.value, longitude.value];
    
    // Amenities
    selectedAmenities.value = listing.Amenities || listing.amenities || [];
    
    // Fotoğraflar
    const photoUrls = listing.PhotoUrls || listing.photoUrls || [];
    photos.value = photoUrls.map((url, idx) => ({ url, name: `photo-${idx}` }));
    
    toast.add({
      severity: 'success',
      summary: 'Başarılı',
      detail: 'İlan verileri yüklendi. Düzenleyebilirsiniz.',
      life: 3000
    });
  } catch (error) {
    console.error('İlan yükleme hatası:', error);
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'İlan verileri yüklenirken hata oluştu',
      life: 3000
    });
    router.push('/my-listings');
  }
}

const closeLoginModal = () => {
  loginError.value = '';
  isLoginModalOpen.value = false;
};
const handleLogin = (userData) => {
  user.value = userData;
  closeLoginModal();
};
const nextStep = () => {
  if (currentStep.value < steps.length - 1) currentStep.value++;
};

// İlanı yayınla veya güncelle fonksiyonu
async function publishListing() {
  const listing = {
    placeType: selectedPlace.value,
    accommodationType: selectedAccommodation.value,
    guests: guests.value,
    bedrooms: bedrooms.value,
    beds: beds.value,
    bathrooms: bathrooms.value,
    title: title.value,
    description: description.value,
    price: price.value,
    addressCountry: addressCountry.value,
    addressDistrict: addressDistrict.value,
    addressStreet: addressStreet.value,
    addressBuilding: addressBuilding.value,
    addressPostalCode: addressPostalCode.value,
    addressRegion: addressRegion.value,
    addressCity: addressCity.value,
    amenities: selectedAmenities.value,
    photoUrls: photos.value.map(p => p.url),
    latitude: latitude.value,
    longitude: longitude.value
  };
  
  try {
    let response;
    
    if (editMode.value && editingListingId.value) {
      // Güncelleme modu
      response = await myListingsAPI.updateListing(editingListingId.value, listing);
      
      toast.add({ 
        severity: 'success', 
        summary: 'Başarılı!', 
        detail: 'İlanınız başarıyla güncellendi.', 
        life: 3000 
      });
    } else {
      // Yeni ilan oluşturma
      response = await myListingsAPI.createListing(listing);
      
      toast.add({ 
        severity: 'success', 
        summary: 'Başarılı!', 
        detail: 'İlanınız başarıyla yayınlandı.', 
        life: 3000 
      });
    }
    
    // İlanlarım sayfasına yönlendir
    setTimeout(() => router.push('/my-listings'), 1500);
  } catch (err) {
    console.error('İlan oluşturma hatası:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Hata', 
      detail: 'İlan yayınlanırken bir hata oluştu: ' + (err.response?.data?.message || err.message), 
      life: 3000 
    });
  }
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--;
};

const placeOptions = [
  { icon: 'home', label: 'Ev' },
  { icon: 'apartment', label: 'Daire' },
  { icon: 'inventory_2', label: 'Ambar' },
  { icon: 'local_cafe', label: 'Oda-kahvaltı' },
  { icon: 'directions_boat', label: 'Tekne' },
  { icon: 'cottage', label: 'Kulübe' },
  { icon: 'rv_hookup', label: 'Kamp aracı/karavan' },
  { icon: 'location_on', label: 'Casa particular' },
  { icon: 'castle', label: 'Şato' }
];

const accommodationOptions = [
  { icon: 'home', label: 'Bütün mekan' },
  { icon: 'hotel', label: 'Bir oda' },
  { icon: 'group', label: 'Paylaşılan oda' }
];

const selectedPlace = ref(null);
const selectedAccommodation = ref(null);
const hovered = ref(null);

const selectPlace = (option) => selectedPlace.value = option.label;
const selectAccommodation = (option) => selectedAccommodation.value = option.label;

// Sayaçlar
const guests = ref(2);
const bedrooms = ref(1);
const beds = ref(1);
const bathrooms = ref(1);
// Fotoğraf ekleme için
const photos = ref([]);
const fileUploadRef = ref(null);

function handlePhotoUpload(event) {
  const files = event.files || [];
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      photos.value.push({ url: e.target.result, name: file.name });
    };
    reader.readAsDataURL(file);
  });
  // Pending durumunu kaldır
  if (fileUploadRef.value) {
    fileUploadRef.value.clear();
  }
}

function removePhoto(idx) {
  photos.value.splice(idx, 1);
}

// Son step için başlık ve açıklama
const title = ref("");
const description = ref("");

// Fiyat bilgisi için
const price = ref("");

// Adres bilgileri için
const addressCountry = ref('');
const addressDistrict = ref('');
const addressStreet = ref('');
const addressBuilding = ref('');
const addressPostalCode = ref('');
const addressRegion = ref('');
const addressCity = ref('');

// Harita için
const latitude = ref(39.9334); // Türkiye merkezi
const longitude = ref(32.8597);
const searchQuery = ref('');
const searchResults = ref([]);
const markerPosition = ref([39.9334, 32.8597]);

// Haritaya tıklayınca marker'ı taşı
function onMapClick(event) {
  const { lat, lng } = event.latlng;
  latitude.value = lat;
  longitude.value = lng;
  markerPosition.value = [lat, lng];
  
  // Tıklanan konumun adres bilgisini al (reverse geocoding)
  getReverseGeocode(lat, lng);
}

// Koordinattan adres bilgisi al
async function getReverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.address) {
      addressCountry.value = data.address.country || '';
      addressCity.value = data.address.city || data.address.town || data.address.village || '';
      addressDistrict.value = data.address.suburb || data.address.neighbourhood || '';
      addressStreet.value = data.address.road || '';
      addressPostalCode.value = data.address.postcode || '';
      addressRegion.value = data.address.state || data.address.region || '';
      searchQuery.value = data.display_name;
    }
  } catch (err) {
    console.error('Reverse geocoding hatası:', err);
  }
}

// Yer arama fonksiyonu (Nominatim API - OpenStreetMap)
async function searchLocation() {
  if (searchQuery.value.length < 3) {
    searchResults.value = [];
    return;
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=5&addressdetails=1`
    );
    const data = await response.json();
    searchResults.value = data;
  } catch (err) {
    console.error('Arama hatası:', err);
  }
}

// Yer seçimi
function selectLocation(result) {
  latitude.value = parseFloat(result.lat);
  longitude.value = parseFloat(result.lon);
  markerPosition.value = [latitude.value, longitude.value];
  
  // Adres bilgilerini doldur
  if (result.address) {
    addressCountry.value = result.address.country || '';
    addressCity.value = result.address.city || result.address.town || result.address.village || '';
    addressDistrict.value = result.address.suburb || result.address.neighbourhood || '';
    addressStreet.value = result.address.road || '';
    addressPostalCode.value = result.address.postcode || '';
    addressRegion.value = result.address.state || result.address.region || '';
  }
  
  searchQuery.value = result.display_name;
  searchResults.value = [];
}


// Olanaklar (amenities) için ek kodlar
const amenitiesOptions = [
  { icon: 'wifi', label: 'Wifi' },
  { icon: 'tv', label: 'TV' },
  { icon: 'kitchen', label: 'Mutfak' },
  { icon: 'local_laundry_service', label: 'Çamaşır makinesi' },
  { icon: 'local_parking', label: 'Binada ücretsiz otopark' },
  { icon: 'paid', label: 'Mülkte ücretli otopark' },
  { icon: 'ac_unit', label: 'Klima' },
  { icon: 'work', label: 'Özel çalışma alanı' },
  { icon: 'pool', label: 'Havuz' },
  { icon: 'hot_tub', label: 'Jakuzi' },
  { icon: 'deck', label: 'Veranda' },
  { icon: 'outdoor_grill', label: 'Mangal' },
  { icon: 'restaurant', label: 'Açık havada yemek alanı' },
  { icon: 'casino', label: 'Bilardo masası' },
  { icon: 'fireplace', label: 'Şömine' },
  { icon: 'piano', label: 'Piyano' },
  { icon: 'fitness_center', label: 'Egzersiz ekipmanı' },
  { icon: 'waves', label: 'Göle erişim' },
  { icon: 'beach_access', label: 'Plaja erişim' }
];
const selectedAmenities = ref([]);
function toggleAmenity(label) {
  const idx = selectedAmenities.value.indexOf(label);
  if (idx === -1) selectedAmenities.value.push(label);
  else selectedAmenities.value.splice(idx, 1);
}


</script>

<template>
  <Toast />
  <div class="max-w-3xl mx-auto py-10">
    <!-- Adım içerikleri -->
    <div v-if="currentStep === 0" class="mt-16">
      <!-- 1. Adım içeriği -->
      <h2 class="text-xl font-bold mb-4">Aşağıdakilerden hangisi yerinizi en iyi tanımlıyor?</h2>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="option in placeOptions"
          :key="option.label"
          class="border p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all duration-150"
          :class="[
            selectedPlace === option.label ? 'bg-primary/10 ring-1 ring-primary' : '',
            hovered === option.label && selectedPlace !== option.label ? 'bg-blue-100' : '',
            'hover:bg-gray-50'
          ]"
          @click="selectPlace(option)"
          @mouseover="hovered = option.label"
          @mouseleave="hovered = null"
        >
          <i class="material-icons text-2xl mb-2">{{ option.icon }}</i>
          <span class="font-medium">{{ option.label }}</span>
        </div>
      </div>
    </div>
    <div v-else-if="currentStep === 1" class="mt-16">
      <!-- 2. Adım içeriği -->
      <h2 class="text-xl font-bold mb-4">Misafirlere ne tür bir yer sağlanacak?</h2>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="option in accommodationOptions"
          :key="option.label"
          class="border p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all duration-150"
          :class="[
            selectedAccommodation === option.label ? 'bg-primary/10 ring-1 ring-primary' : '',
            hovered === option.label && selectedAccommodation !== option.label ? 'bg-blue-100' : '',
            'hover:bg-gray-50'
          ]"
          @click="selectAccommodation(option)"
          @mouseover="hovered = option.label"
          @mouseleave="hovered = null"
        >
          <i class="material-icons text-2xl mb-2">{{ option.icon }}</i>
          <span class="font-medium">{{ option.label }}</span>
        </div>
      </div>
    </div>
    <div v-else-if="currentStep === 2" class="mt-16">
      <!-- 3. Adım içeriği - Harita ve Konum -->
      <h2 class="text-2xl font-bold mb-4">Yeriniz nerede bulunuyor?</h2>
      <p class="text-gray-500 mb-6">Adresiniz yalnızca misafir rezervasyon yaptıktan sonra onlarla paylaşılır.</p>
      
      <!-- Arama çubuğu -->
      <div class="relative mb-6">
        <input
          v-model="searchQuery"
          @input="searchLocation"
          type="text"
          placeholder="Şehir, mahalle veya adres arayın..."
          class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        <!-- Arama sonuçları -->
        <div v-if="searchResults.length > 0" class="absolute z-50 w-full bg-white border rounded-lg shadow-2xl mt-1 max-h-64 overflow-y-auto">
          <div
            v-for="result in searchResults"
            :key="result.place_id"
            @click="selectLocation(result)"
            class="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
          >
            <div class="flex items-start gap-2">
              <i class="material-icons text-primary text-lg">place</i>
              <p class="font-medium text-sm">{{ result.display_name }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Harita -->
      <div class="border rounded-lg overflow-hidden relative" style="height: 400px; z-index: 1;">
        <LMap
          :zoom="13"
          :center="markerPosition"
          :useGlobalLeaflet="false"
          @click="onMapClick"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LMarker :lat-lng="markerPosition" />
        </LMap>
      </div>
      
      <p class="text-sm text-gray-500 mt-4">
         Konum: {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </p>
      <p class="text-xs text-gray-400 mt-1">
         İpucu: Haritaya tıklayarak veya arayarak konumunuzu belirleyin
      </p>
    </div>
    <div v-else-if="currentStep === 3" class="mt-16">
      <h2 class="text-2xl font-bold mb-2">Yerinizle ilgili bazı temel bilgileri paylaşın</h2>
      <p class="text-gray-500 mb-8">Daha sonra, yatak türü gibi diğer ayrıntıları ekleyebilirsiniz.</p>

      <div class="divide-y divide-gray-200 text-gray-800">
        <div class="flex items-center justify-between py-4">
          <span class="font-medium">Misafir</span>
          <div class="flex items-center gap-6">
            <InputNumber v-model="guests" showButtons buttonLayout="horizontal" :min="1" :max="99"
              :inputStyle="{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', width: '3.5rem' }"
              class="border rounded-lg shadow-sm" style="width:9rem;">
              <template #incrementbuttonicon>
                <span class="pi pi-plus" />
              </template>
              <template #decrementbuttonicon>
                <span class="pi pi-minus" />
              </template>
            </InputNumber>
          </div>
        </div>
        <div class="flex items-center justify-between py-4">
          <span class="font-medium">Yatak odası</span>
          <div class="flex items-center gap-6">
            <InputNumber v-model="bedrooms" showButtons buttonLayout="horizontal" :min="0" :max="99"
              :inputStyle="{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', width: '3.5rem' }"
              class="border rounded-lg shadow-sm" style="width:9rem;">
              <template #incrementbuttonicon>
                <span class="pi pi-plus" />
              </template>
              <template #decrementbuttonicon>
                <span class="pi pi-minus" />
              </template>
            </InputNumber>
          </div>
        </div>
        <div class="flex items-center justify-between py-4">
          <span class="font-medium">Yatak</span>
          <div class="flex items-center gap-6">
            <InputNumber v-model="beds" showButtons buttonLayout="horizontal" :min="1" :max="99"
              :inputStyle="{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', width: '3.5rem' }"
              class="border rounded-lg shadow-sm" style="width:9rem;">
              <template #incrementbuttonicon>
                <span class="pi pi-plus" />
              </template>
              <template #decrementbuttonicon>
                <span class="pi pi-minus" />
              </template>
            </InputNumber>
          </div>
        </div>
        <div class="flex items-center justify-between py-4">
          <span class="font-medium">Banyo</span>
          <div class="flex items-center gap-6">
            <InputNumber v-model="bathrooms" showButtons buttonLayout="horizontal" :min="0" :max="99"
              :inputStyle="{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', width: '3.5rem' }"
              class="border rounded-lg shadow-sm" style="width:9rem;">
              <template #incrementbuttonicon>
                <span class="pi pi-plus" />
              </template>
              <template #decrementbuttonicon>
                <span class="pi pi-minus" />
              </template>
            </InputNumber>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="currentStep === 4" class="mt-16">
      <h2 class="text-2xl font-bold mb-2">Misafirlerinize yerinizin neler sunduğunu anlatın</h2>
      <p class="text-gray-500 mb-8">Kaydınızı yayımladıktan sonra daha fazla olanak ekleyebilirsiniz.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
        <div v-for="option in amenitiesOptions" :key="option.label"
          class="border rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 shadow-sm"
          :class="selectedAmenities.includes(option.label) ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-gray-50'"
          style="min-height:100px;"
          @click="toggleAmenity(option.label)"
        >
          <i class="material-icons text-4xl mb-3">{{ option.icon }}</i>
          <span class="font-medium text-base text-center leading-tight">{{ option.label }}</span>
        </div>
      </div>
    </div>
    <div v-else-if="currentStep === 5" class="mt-16">
        <h2 class="text-2xl font-bold mb-2">{{ selectedPlace || 'yer' }} kategorisindeki yerinizin bazı fotoğraflarını ekleyin</h2>
        <p class="text-gray-500 mb-8">Başlamak için 5 fotoğraf gerekiyor. Daha sonra başka fotoğraflar ekleyebilir veya bunları değiştirebilirsiniz.</p>
        <div class="mb-6">
          <FileUpload
            ref="fileUploadRef"
            name="photos"
            multiple
            accept="image/*"
            :customUpload="true"
            @select="handlePhotoUpload"
            :auto="true"
            chooseLabel="Fotoğraf Seç"
            class="mb-4"
          />
          
          <!-- Yüklenen fotoğrafları göster -->
          <div v-if="photos.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
            <div v-for="(photo, idx) in photos" :key="idx" class="relative group">
              <img :src="photo.url" :alt="photo.name" class="w-full h-32 object-cover rounded-lg" />
              <button 
                @click="removePhoto(idx)"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i class="material-icons text-sm">close</i>
              </button>
            </div>
          </div>
          
          <p v-if="photos.length < 5" class="text-red-500 mt-4">En az 5 fotoğraf eklemelisiniz ({{ photos.length }}/5).</p>
          <p v-else class="text-green-600 mt-4">✓ {{ photos.length }} fotoğraf eklendi.</p>
        </div>
    </div>
    <div v-else-if="currentStep === 6" class="mt-16">
      <div class="mb-10">
  <h2 class="text-2xl font-bold mb-2">Şimdi bu {{ selectedPlace || 'yer' }} için bir başlık belirleyelim</h2>
        <p class="text-gray-500 mb-6">En iyi sonucu kısa başlıklar verir. Endişelenmeyin, daha sonra istediğiniz zaman değiştirebilirsiniz.</p>
        <textarea
          v-model="title"
          maxlength="50"
          rows="3"
          class="w-full border rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        ></textarea>
  <div class="text-gray-500 font-semibold mt-2">{{ title.length }}/50</div>
      </div>
      <div>
        <h2 class="text-2xl font-bold mb-2">Açıklamanızı yazın</h2>
        <p class="text-gray-500 mb-6">Yerinizi özel kılan şeyleri paylaşın.</p>
        <textarea
          v-model="description"
          maxlength="500"
          rows="4"
          class="w-full border rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        ></textarea>
  <div class="text-gray-500 font-semibold mt-2">{{ description.length }}/500</div>
      </div>
    </div>
    <div v-else-if="currentStep === 7" class="mt-16">
      <div class="mb-10">
        <h2 class="text-2xl font-bold mb-2">Fiyatınızı belirleyin</h2>
        <p class="text-gray-500 mb-6">Misafirlerinizden gecelik talep edeceğiniz fiyatı girin.</p>
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">₺</span>
          <input
            v-model="price"
            type="number"
            min="0"
            max="99999"
            class="w-40 border rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Gecelik fiyat"
          />
        </div>
        <div class="text-gray-500 font-semibold mt-2">Gecelik fiyatı girin</div>
      </div>
    </div>
    <div v-else-if="currentStep === 8" class="mt-16">
      <h2 class="text-2xl font-bold mb-2">Son birkaç ayrıntıyı girin</h2>
      <p class="text-gray-800 mb-8">İkametgâh adresiniz nedir?<br><span class="text-sm text-gray-600">Misafirler bu bilgileri görmez.</span></p>
      <div class="max-w-xl mx-auto">
        <div class="mb-2">
          <input v-model="addressCountry" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="Ülke/bölge" />
        <input v-model="addressDistrict" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="Semt (varsa)" />
        <input v-model="addressStreet" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="Sokak, cadde" />
        <input v-model="addressBuilding" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="Daire, kat, bina (varsa)" />
        <input v-model="addressPostalCode" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="Posta kodu" />
        <input v-model="addressRegion" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="Bölge" />
        <input v-model="addressCity" type="text" class="w-full border rounded-lg p-3 mb-2" placeholder="İl" />
      </div>
    </div>
  

  

    </div>
    <div v-else-if="currentStep === 9" class="mt-16">
      <h2 class="text-3xl font-bold mb-4">
        {{ editMode ? 'İlanınızı Güncelleyin!' : 'Tebrikler! İlanınızı yayınlamaya hazırsınız.' }}
      </h2>
      <p class="text-gray-600 mb-10">
        {{ editMode ? 'Değişiklikleri gözden geçirin ve güncelleyin.' : 'İşte misafirlerin göreceği ilan önizlemesi. Yayınlamadan önce detayları gözden geçirin.' }}
      </p>
      <div class="flex flex-col md:flex-row gap-10 items-start">
        <!-- İlan kartı -->
        <div class="bg-white rounded-2xl shadow-lg p-4 w-full md:w-96">
          <div class="relative rounded-xl overflow-hidden mb-3" style="height:220px;">
            <img :src="photos[0]?.url" alt="preview" class="object-cover w-full h-full" />
            <span class="absolute top-2 left-2 bg-black/70 text-white text-xs px-3 py-1 rounded">Önizleme</span>
          </div>
          <div class="font-semibold text-lg mb-1">{{ title || 'Başlık' }}</div>
          <div class="text-gray-500 mb-2">{{ description || 'Açıklama' }}</div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-primary text-xl">₺{{ price || 130 }}</span>
            <span class="text-gray-500">gecelik</span>
          </div>
          <div class="mt-2 text-xs text-gray-500">Yeni <span class="text-yellow-500">★</span></div>
        </div>
        <!-- What's next kutusu -->
        <div class="flex-1">
          <h3 class="text-xl font-bold mb-4">Sırada ne var?</h3>
          <ul class="space-y-6">
            <li class="flex items-start gap-4">
              <i class="material-icons text-3xl text-primary">calendar_month</i>
              <div>
                <div class="font-semibold">Takvimi ayarla</div>
                <div class="text-gray-500 text-sm">Hangi tarihlerde müsait olduğunu seç. Misafirler yayından 24 saat sonra rezervasyon yapabilir.</div>
              </div>
            </li>
            <li class="flex items-start gap-4">
              <i class="material-icons text-3xl text-primary">settings</i>
              <div>
                <div class="font-semibold">Ayarlarını düzenle</div>
                <div class="text-gray-500 text-sm">Ev kurallarını belirle, iptal politikasını seç, misafirlerin nasıl rezervasyon yapacağını ayarla.</div>
              </div>
            </li>
            <li class="flex items-start gap-4">
              <i class="material-icons text-3xl text-primary">support_agent</i>
              <div>
                <div class="font-semibold">İlk misafirine hazırlan</div>
                <div class="text-gray-500 text-sm">Yardım merkezi ve müşteri desteği ile ilgili ipuçlarını bul.</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  


        <!-- Adım butonları -->
    <div class="flex justify-between mt-8">
      <div v-if="currentStep > 0">
        <button
          class="px-6 py-2 rounded-lg bg-gray-200 transition-colors duration-150 hover:bg-gray-300"
          :disabled="currentStep <= 0"
          @click="prevStep"
        >
          Geri
        </button>
      </div>
      <div v-else></div>
        <button
          class="px-6 py-2 rounded-lg bg-primary text-white transition-colors duration-150 hover:bg-[#f22e50] disabled:bg-primary/40"
          :disabled="
            (currentStep === 0 && !selectedPlace) ||
            (currentStep === 1 && !selectedAccommodation)
          "
          @click="currentStep === steps.length - 1 ? publishListing() : nextStep()"
      >
        {{ currentStep === steps.length - 1 ? (editMode ? 'Güncelle' : 'Yayınla') : 'İleri' }}
      </button>
    </div>

  </div>
  <LoginModal 
    :isOpen="isLoginModalOpen" 
    :errorMessage="loginError"
    @close="closeLoginModal"
    @login-success="handleLogin"
  />
</template>



