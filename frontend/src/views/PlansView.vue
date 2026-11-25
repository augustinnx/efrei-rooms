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
    if (!response.ok) throw new Error(data.message || 'Unable to load your account.')
    isPremium.value = data.isPremium
  } catch (e) {
    error.value = e.message || 'Unable to load your account.'
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
    if (!response.ok) throw new Error(data.message || 'Unable to activate the Pro plan.')
    isPremium.value = data.isPremium
    message.value = 'Your Pro plan is active.'
  } catch (e) {
    error.value = e.message || 'Unable to activate the Pro plan.'
  } finally {
    activating.value = false
  }
}

onMounted(loadAccount)
</script>

<template>
  <main class="container plans-page">
    <RouterLink to="/my-bookings" class="back-link">← My bookings</RouterLink>
    <header class="plans-heading">
      <span class="plans-eyebrow">EF'Rooms · Plans</span>
      <h1>Choose your plan</h1>
      <p>Study groups remain accessible to everyone, regardless of your plan.</p>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="message" class="success" role="status">{{ message }}</p>

    <div class="plans-grid">
      <section class="plan-card card">
        <div>
          <span class="plan-label">To get started</span>
          <h2>Free</h2>
          <p class="plan-price">€0 <span>/ always</span></p>
          <ul>
            <li>1 room booking per week</li>
            <li>Unlimited access to open groups</li>
            <li>Access to office hours</li>
          </ul>
        </div>
        <span v-if="!isPremium && !loading" class="plan-current">Your current plan</span>
      </section>

      <section class="plan-card plan-card-pro card">
        <div class="plan-ribbon">Most popular</div>
        <span class="plan-label">More flexibility</span>
        <h2>EF'Rooms Pro</h2>
        <p class="plan-price">€1.99 <span>/ month</span></p>
        <ul>
          <li>Unlimited room bookings</li>
          <li>Unlimited access to open groups</li>
          <li>No commitment</li>
        </ul>
        <button
          type="button"
          class="plan-cta"
          :disabled="loading || activating || isPremium"
          @click="activatePremium"
        >
          {{ loading ? 'Loading…' : activating ? 'Activating…' : isPremium ? 'Pro plan active' : 'Upgrade to Pro' }}
        </button>
      </section>
    </div>
    <p class="plans-disclaimer">Payment-free demo: no payment method is required.</p>
  </main>
</template>
