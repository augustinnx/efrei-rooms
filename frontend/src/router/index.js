import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import CampusesView from '../views/CampusesView.vue'
import MyBookingsView from '../views/MyBookingsView.vue'
import DashboardView from '../views/DashboardView.vue'
import TeachersView from '../views/TeachersView.vue'
import PlansView from '../views/PlansView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    // meta.requiresAuth = true : cette page est réservée aux connectés
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/campuses/:id?', name: 'campuses', component: CampusesView, meta: { requiresAuth: true } },
    { path: '/my-bookings', name: 'my-bookings', component: MyBookingsView, meta: { requiresAuth: true } },
    { path: '/plans', name: 'plans', component: PlansView, meta: { requiresAuth: true } },
    { path: '/teachers', name: 'teachers', component: TeachersView, meta: { requiresAuth: true } },
  ],
})

// Un "garde" : s'exécute avant chaque changement de page
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true // page publique : on laisse passer

  try {
    // On demande au serveur si une session existe
    const response = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include',
    })
    if (response.ok) return true // connecté : on laisse passer
  } catch (e) {
    // serveur injoignable : on traite comme non connecté
  }

  return '/login' // sinon, on renvoie vers la connexion
})

export default router