import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import '@vuepic/vue-datepicker/dist/main.css';

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';


const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false
        }
    }
})
app.use(ToastService);
app.use(router);
app.mount('#app');

