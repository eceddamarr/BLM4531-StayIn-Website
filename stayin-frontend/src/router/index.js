import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/become-host',
    name: 'BecomeHost',
    component: () => import('../views/BecomeHost.vue')
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/Favorites.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/my-listings',
    name: 'MyListings',
    component: () => import('../views/MyListings.vue')
  },
  {
    path: '/reservations',
    name: 'Reservations',
    component: () => import('../views/Reservations.vue')
  },
  {
    path: '/listing/:id',
    name: 'ListingDetail',
    component: () => import('../views/ListingDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router