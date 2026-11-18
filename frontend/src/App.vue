<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppFooter from './components/AppFooter.vue'

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
      <RouterLink :to="route.meta.requiresAuth ? '/dashboard' : '/'" class="brand">EF'Rooms</RouterLink>

      <!-- Affiché seulement sur les pages réservées aux connectés -->
      <nav v-if="route.meta.requiresAuth" class="topbar-nav">
        <RouterLink to="/dashboard">Accueil</RouterLink>
        <RouterLink to="/campuses">Campus</RouterLink>
        <RouterLink to="/my-bookings">Mes réservations</RouterLink>
        <button class="link-button" @click="logout">Se déconnecter</button>
      </nav>
    </div>
  </header>

  <RouterView />

  <AppFooter />
</template>