<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import logo from './assets/door-open.svg'
import logoutIcon from './assets/square-arrow-left-exit.svg'

const route = useRoute() // la page affichée en ce moment
const router = useRouter()

// Détruit la session côté serveur, puis retour à l'accueil
async function logout() {
  await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  router.push('/')
}
</script>

<template>
  <header class="topbar">
    <div class="container topbar-inner">
      <RouterLink :to="route.meta.requiresAuth ? '/dashboard' : '/'" class="brand">
        <img :src="logo" alt="" class="brand-logo" />
        <span>EF'Rooms</span>
      </RouterLink>

      <!-- Affiché seulement sur les pages réservées aux connectés -->
      <nav v-if="route.meta.requiresAuth" class="topbar-nav">
        <RouterLink to="/campuses">Réserver une salle</RouterLink>
        <RouterLink to="/my-bookings">Mes réservations</RouterLink>
        <button type="button" class="icon-button" @click="logout" aria-label="Se déconnecter" title="Se déconnecter">
          <img :src="logoutIcon" alt="" class="icon" />
        </button>
      </nav>
    </div>
  </header>

  <RouterView />

  <AppFooter />
</template>