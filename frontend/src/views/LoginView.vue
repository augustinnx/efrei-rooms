<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const forgotPassword = ref(false)
const resetEmail = ref('')
const resetMessage = ref('')

// Validation côté CLIENT
function validate() {
  if (!form.value.email.trim() || !form.value.password) {
    return 'Email and password are required.'
  }
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // reçoit le cookie de session
      body: JSON.stringify(form.value),
    })
    const data = await response.json()

    if (!response.ok) {
      error.value = data.message
      return
    }

    router.push('/dashboard') // connecté : on arrive sur la page d'accueil
  } catch (e) {
    error.value = 'Server unreachable.'
  } finally {
    loading.value = false
  }
}

function requestReset() {
  resetMessage.value = ''
  if (!resetEmail.value.trim().endsWith('@efrei.net')) {
    resetMessage.value = 'Enter a valid @efrei.net email address.'
    return
  }
  resetMessage.value = 'If an account exists for this email, password reset instructions will be sent.'
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-shell">
      <aside class="auth-showcase">
        <RouterLink to="/" class="auth-brand">
          <span class="auth-brand-mark">E</span>
          <span>EF'Rooms</span>
        </RouterLink>
        <div class="auth-showcase-copy">
          <p class="auth-kicker">YOUR CAMPUS, ORGANIZED</p>
          <h2>Find your place.<br />Make room for focus.</h2>
          <p>One place to book rooms, join study groups and meet with teachers.</p>
        </div>
        <div class="auth-preview" aria-hidden="true">
          <div class="auth-preview-header"><span></span><span></span><span></span></div>
          <div class="auth-preview-title"><i></i><b></b></div>
          <div class="auth-preview-grid">
            <div></div><div class="active"></div><div></div>
            <div></div><div></div><div class="active"></div>
          </div>
        </div>
      </aside>

      <section class="auth-panel">
        <RouterLink to="/" class="auth-mobile-brand">EF'Rooms</RouterLink>
        <div class="auth-form-wrap">
          <div v-if="!forgotPassword">
            <p class="auth-kicker">WELCOME BACK</p>
            <h1>Log in to EF'Rooms</h1>
            <p class="auth-intro">Continue organizing your study sessions.</p>

            <form class="auth-form" @submit.prevent="submit">
              <label for="email">EFREI email</label>
              <div class="auth-input">
                <span aria-hidden="true">@</span>
                <input id="email" type="email" v-model="form.email" placeholder="first.last@efrei.net" autocomplete="email" />
              </div>

              <div class="auth-label-row">
                <label for="password">Password</label>
                <button type="button" class="auth-text-button" @click="forgotPassword = true">Forgot password?</button>
              </div>
              <div class="auth-input">
                <span aria-hidden="true">•</span>
                <input id="password" :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="Enter your password" autocomplete="current-password" />
                <button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>

              <p v-if="error" class="auth-error">{{ error }}</p>

              <button type="submit" class="auth-submit" :disabled="loading">
                <span>{{ loading ? 'Logging in…' : 'Log in' }}</span>
                <b v-if="!loading" aria-hidden="true">→</b>
              </button>
            </form>

            <p class="auth-switch">
              Don't have an account?
              <RouterLink to="/register">Create one</RouterLink>
            </p>
          </div>

          <div v-else class="reset-panel">
            <button type="button" class="auth-back" @click="forgotPassword = false">← Back to login</button>
            <div class="reset-icon" aria-hidden="true">↺</div>
            <p class="auth-kicker">PASSWORD RECOVERY</p>
            <h1>Reset your password</h1>
            <p class="auth-intro">Enter your EFREI email. We’ll send you instructions if an account is found.</p>

            <form class="auth-form" @submit.prevent="requestReset">
              <label for="resetEmail">EFREI email</label>
              <div class="auth-input">
                <span aria-hidden="true">@</span>
                <input id="resetEmail" type="email" v-model="resetEmail" placeholder="first.last@efrei.net" autocomplete="email" />
              </div>
              <p v-if="resetMessage" class="reset-message">{{ resetMessage }}</p>
              <button type="submit" class="auth-submit">
                <span>Send reset instructions</span>
                <b aria-hidden="true">→</b>
              </button>
            </form>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>