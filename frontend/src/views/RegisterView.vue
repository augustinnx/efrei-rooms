<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Les champs du formulaire, regroupés dans un seul objet
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
})

const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1
  return score
})

// Validation côté CLIENT : on vérifie avant d'envoyer
function validate() {
  if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
    return 'First and last name are required.'
  }
  if (!form.value.email.trim().endsWith('@efrei.net')) {
    return 'Use your @efrei.net address.'
  }
  if (form.value.password.length < 8) {
    return 'Password must contain at least 8 characters.'
  }
  return ''
}

// Appelée quand on clique sur "Créer mon compte"
async function submit() {
  error.value = validate()
  if (error.value) return // on s'arrête s'il y a une erreur

  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // permet de recevoir le cookie de session
      body: JSON.stringify(form.value),
    })
    const data = await response.json()

    if (!response.ok) {
      // Erreur renvoyée par le serveur (ex : email déjà utilisé)
      error.value = data.message
      return
    }

    router.push('/dashboard') // succès : on est connecté, direction l'accueil
  } catch (e) {
    error.value = 'Server unreachable.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page auth-page-register">
    <section class="auth-shell">
      <aside class="auth-showcase">
        <RouterLink to="/" class="auth-brand">
          <span class="auth-brand-mark">E</span>
          <span>EF'Rooms</span>
        </RouterLink>
        <div class="auth-showcase-copy">
          <p class="auth-kicker">JOIN THE CAMPUS COMMUNITY</p>
          <h2>A better place<br />for every study session.</h2>
          <p>Create an account, reserve your next room and learn with other EFREI students.</p>
        </div>
        <div class="auth-benefits" aria-label="Account benefits">
          <div><span>01</span><p><strong>Book instantly</strong><small>Available rooms on every campus</small></p></div>
          <div><span>02</span><p><strong>Study together</strong><small>Join open revision groups</small></p></div>
          <div><span>03</span><p><strong>Stay connected</strong><small>Reach teachers when you need help</small></p></div>
        </div>
      </aside>

      <section class="auth-panel">
        <RouterLink to="/" class="auth-mobile-brand">EF'Rooms</RouterLink>
        <div class="auth-form-wrap">
          <p class="auth-kicker">GET STARTED</p>
          <h1>Create your account</h1>
          <p class="auth-intro">Set up your EFREI profile in less than a minute.</p>

          <form class="auth-form" @submit.prevent="submit">
            <div class="auth-name-grid">
              <div>
                <label for="firstName">First name</label>
                <div class="auth-input">
                  <input id="firstName" type="text" v-model="form.firstName" placeholder="First name" autocomplete="given-name" />
                </div>
              </div>
              <div>
                <label for="lastName">Last name</label>
                <div class="auth-input">
                  <input id="lastName" type="text" v-model="form.lastName" placeholder="Last name" autocomplete="family-name" />
                </div>
              </div>
            </div>

            <label for="email">EFREI email</label>
            <div class="auth-input">
              <span aria-hidden="true">@</span>
              <input id="email" type="email" v-model="form.email" placeholder="first.last@efrei.net" autocomplete="email" />
            </div>

            <label for="password">Password</label>
            <div class="auth-input">
              <span aria-hidden="true">•</span>
              <input id="password" :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="Create a strong password" autocomplete="new-password" />
              <button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>

            <div class="password-strength" :data-level="passwordStrength" aria-label="Password strength">
              <span></span><span></span><span></span>
              <small>{{ passwordStrength === 0 ? 'Minimum 8 characters' : passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Good' : 'Strong' }}</small>
            </div>

            <p v-if="error" class="auth-error">{{ error }}</p>

            <button type="submit" class="auth-submit" :disabled="loading">
              <span>{{ loading ? 'Creating account…' : 'Create account' }}</span>
              <b v-if="!loading" aria-hidden="true">→</b>
            </button>
          </form>

          <p class="auth-switch">
            Already have an account?
            <RouterLink to="/login">Log in</RouterLink>
          </p>
        </div>
      </section>
    </section>
  </main>
</template>