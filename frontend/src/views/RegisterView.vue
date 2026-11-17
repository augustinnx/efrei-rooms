<script setup>
import { ref } from 'vue'
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

// Validation côté CLIENT : on vérifie avant d'envoyer
function validate() {
  if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
    return 'Le prénom et le nom sont obligatoires.'
  }
  if (!form.value.email.trim().endsWith('@efrei.net')) {
    return 'Utilisez votre adresse @efrei.net.'
  }
  if (form.value.password.length < 8) {
    return 'Le mot de passe doit faire au moins 8 caractères.'
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
    error.value = 'Serveur injoignable.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container">
    <h1>Créer un compte</h1>

    <div class="card">
      <form @submit.prevent="submit">
        <label for="firstName">Prénom</label>
        <input id="firstName" type="text" v-model="form.firstName" />

        <label for="lastName">Nom</label>
        <input id="lastName" type="text" v-model="form.lastName" />

        <label for="email">Email EFREI</label>
        <input id="email" type="email" v-model="form.email" placeholder="prenom.nom@efrei.net" />

        <label for="password">Mot de passe (8 caractères minimum)</label>
        <input id="password" type="password" v-model="form.password" />

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Création...' : 'Créer mon compte' }}
        </button>
      </form>
    </div>
  </main>
</template>