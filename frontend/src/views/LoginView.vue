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
</script>

<template>
  <main class="container">
    <h1>Log in</h1>

    <div class="card">
      <form @submit.prevent="submit">
        <label for="email">EFREI email</label>
        <input id="email" type="email" v-model="form.email" placeholder="prenom.nom@efrei.net" />

        <label for="password">Password</label>
        <input id="password" type="password" v-model="form.password" />

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p>
        Don't have an account yet?
        <RouterLink to="/register">Sign up</RouterLink>
      </p>
    </div>
  </main>
</template>