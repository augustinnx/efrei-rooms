<script setup>
import { onMounted, ref } from 'vue'

const isPremium = ref(false)
const loading = ref(true)
const activating = ref(false)
const error = ref('')
const message = ref('')

async function loadAccount() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Impossible de charger votre compte.')
    isPremium.value = data.isPremium
  } catch (e) {
    error.value = e.message || 'Impossible de charger votre compte.'
  } finally {
    loading.value = false
  }
}

async function activatePremium() {
  activating.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/auth/premium', {
      method: 'POST',
      credentials: 'include',
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Impossible d’activer l’offre Pro.')
    isPremium.value = data.isPremium
    message.value = 'Votre offre Pro est activée.'
  } catch (e) {
    error.value = e.message || 'Impossible d’activer l’offre Pro.'
  } finally {
    activating.value = false
  }
}

onMounted(loadAccount)
</script>

<template>
  <main class="container plans-page">
    <RouterLink to="/my-bookings" class="back-link">← Mes réservations</RouterLink>
    <header class="plans-heading">
      <span class="plans-eyebrow">EF'Rooms · Les offres</span>
      <h1>Choisissez votre formule</h1>
      <p>Les groupes de révision restent accessibles à tous, quelle que soit votre offre.</p>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="message" class="success" role="status">{{ message }}</p>

    <div class="plans-grid">
      <section class="plan-card card">
        <div>
          <span class="plan-label">Pour commencer</span>
          <h2>Gratuit</h2>
          <p class="plan-price">0 € <span>/ toujours</span></p>
          <ul>
            <li>1 réservation de salle par semaine</li>
            <li>Accès illimité aux groupes ouverts</li>
            <li>Participation aux permanences</li>
          </ul>
        </div>
        <span v-if="!isPremium && !loading" class="plan-current">Votre offre actuelle</span>
      </section>

      <section class="plan-card plan-card-pro card">
        <div class="plan-ribbon">Le plus choisi</div>
        <span class="plan-label">Plus de liberté</span>
        <h2>EF'Rooms Pro</h2>
        <p class="plan-price">1,99 € <span>/ mois</span></p>
        <ul>
          <li>Réservations de salles illimitées</li>
          <li>Accès illimité aux groupes ouverts</li>
          <li>Offre sans engagement</li>
        </ul>
        <button
          type="button"
          class="plan-cta"
          :disabled="loading || activating || isPremium"
          @click="activatePremium"
        >
          {{ loading ? 'Chargement…' : activating ? 'Activation…' : isPremium ? 'Offre Pro active' : 'Passer Pro' }}
        </button>
      </section>
    </div>
    <p class="plans-disclaimer">Simulation sans paiement : aucun moyen de paiement n’est demandé.</p>
  </main>
</template>
