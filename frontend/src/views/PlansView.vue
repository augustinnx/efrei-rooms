<script setup>
import { onMounted, ref } from 'vue'

const premium = ref({ isPremium: false, plan: null, until: null })
const loading = ref(true)
const activatingPlan = ref('')
const error = ref('')
const message = ref('')

async function loadAccount() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Unable to load your account.')
    premium.value = {
      isPremium: data.isPremium,
      plan: data.premiumPlan,
      until: data.premiumUntil,
    }
  } catch (e) {
    error.value = e.message || 'Unable to load your account.'
  } finally {
    loading.value = false
  }
}

async function activatePremium(plan) {
  activatingPlan.value = plan
  error.value = ''
  message.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/auth/premium', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plan }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Unable to activate the Pro plan.')
    premium.value = {
      isPremium: data.isPremium,
      plan: data.premiumPlan,
      until: data.premiumUntil,
    }
    message.value = data.isPremium
      ? `Your plan is active until ${formatExpiry(data.premiumUntil)}. This is a payment-free demo.`
      : 'You switched to the Free plan. This is a payment-free demo.'
  } catch (e) {
    error.value = e.message || 'Unable to activate the Pro plan.'
  } finally {
    activatingPlan.value = ''
  }
}

function planButtonLabel(plan) {
  if (loading.value) return 'Loading…'
  if (activatingPlan.value === plan) return 'Activating…'
  if (plan === 'free') return premium.value.isPremium ? 'Switch to Free' : 'Current plan'
  if (premium.value.isPremium) {
    return premium.value.plan === plan ? 'Extend this plan' : 'Add this plan'
  }
  if (plan === 'monthly') return 'Choose monthly plan'
  if (plan === 'semester') return 'Choose 6-month plan'
  return 'Choose yearly plan'
}

function formatExpiry(date) {
  if (!date) return ''
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(loadAccount)
</script>

<template>
  <main class="container plans-page">
    <RouterLink to="/my-bookings" class="back-link">← My bookings</RouterLink>
    <header class="plans-heading">
      <span class="plans-eyebrow">EF'Rooms · Plans</span>
      <h1>Choose your plan</h1>
      <p>Choose the access that fits your semester. Study groups stay open to everyone.</p>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="message" class="success" role="status">{{ message }}</p>

    <div class="plans-grid">
      <section class="plan-card plan-card-free card">
        <div>
          <span class="plan-label">Start here</span>
          <h2>Free</h2>
          <p class="plan-price">€0 <span>/ always</span></p>
          <ul>
            <li>1 room booking per week</li>
            <li>Unlimited access to open groups</li>
            <li>Access to office hours</li>
          </ul>
        </div>
        <span v-if="!premium.isPremium && !loading" class="plan-current">Your current plan</span>
        <button
          type="button"
          class="plan-cta plan-cta-secondary"
          :disabled="loading || !!activatingPlan || !premium.isPremium"
          @click="activatePremium('free')"
        >
          {{ planButtonLabel('free') }}
        </button>
      </section>

      <section class="plan-card card">
        <div>
          <span class="plan-label">One month</span>
          <h2>Monthly plan</h2>
          <p class="plan-price">€1.99 <span>/ month</span></p>
          <p class="plan-rate">One month of Pro access</p>
          <ul>
            <li>Unlimited room bookings</li>
            <li>Unlimited access to open groups</li>
            <li>Access to office hours</li>
          </ul>
        </div>
        <span v-if="premium.isPremium && premium.plan === 'monthly'" class="plan-current">
          Current plan<span v-if="premium.until"> · until {{ formatExpiry(premium.until) }}</span>
        </span>
        <button type="button" class="plan-cta plan-cta-secondary" :disabled="loading || !!activatingPlan" @click="activatePremium('monthly')">
          {{ planButtonLabel('monthly') }}
        </button>
      </section>

      <section class="plan-card card">
        <div>
          <span class="plan-label">Full semester</span>
          <h2>6-month plan</h2>
          <p class="plan-price">€9.99 <span>/ 6 months</span></p>
          <p class="plan-rate">One semester of Pro access</p>
          <ul>
            <li>Unlimited room bookings</li>
            <li>Unlimited access to open groups</li>
            <li>Access to office hours</li>
          </ul>
        </div>
        <span v-if="premium.isPremium && premium.plan === 'semester'" class="plan-current">
          Current plan<span v-if="premium.until"> · until {{ formatExpiry(premium.until) }}</span>
        </span>
        <button type="button" class="plan-cta plan-cta-secondary" :disabled="loading || !!activatingPlan" @click="activatePremium('semester')">
          {{ planButtonLabel('semester') }}
        </button>
      </section>

      <section class="plan-card plan-card-pro card">
        <div>
          <div class="plan-ribbon">Best value</div>
          <span class="plan-label">One year</span>
          <h2>Annual plan</h2>
          <p class="plan-price">€14.99 <span>/ year</span></p>
          <p class="plan-rate">12 months of Pro access</p>
          <ul>
            <li>Unlimited room bookings</li>
            <li>Unlimited access to open groups</li>
            <li>Full year of Pro access</li>
          </ul>
        </div>
        <span v-if="premium.isPremium && premium.plan === 'yearly'" class="plan-current">
          Current plan<span v-if="premium.until"> · until {{ formatExpiry(premium.until) }}</span>
        </span>
        <button type="button" class="plan-cta" :disabled="loading || !!activatingPlan" @click="activatePremium('yearly')">
          {{ planButtonLabel('yearly') }}
        </button>
      </section>
    </div>
    <p class="plans-disclaimer">Payment-free demo: no payment method is required. Paid plans activate Pro features for the selected period.</p>
  </main>
</template>
