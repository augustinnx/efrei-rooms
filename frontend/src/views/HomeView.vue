<script setup>
import { ref, onMounted } from 'vue'

// Une variable "réactive" : quand elle change, l'écran se met à jour tout seul
const campuses = ref([])
const error = ref('')

// onMounted s'exécute une fois, quand la page s'affiche
onMounted(async () => {
  try {
    // On appelle l'API du backend
    const response = await fetch('http://localhost:3000/api/rooms/campuses')
    if (!response.ok) throw new Error('Erreur serveur')
    campuses.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les campus.'
  }
})
</script>

<template>
  <main>
    <h1>Réservation de salles EFREI</h1>

    <!-- Affiché seulement s'il y a une erreur -->
    <p v-if="error">{{ error }}</p>

    <!-- Sinon, on affiche un élément par campus -->
    <ul v-else>
      <li v-for="campus in campuses" :key="campus.id">{{ campus.name }}</li>
    </ul>
  </main>
</template>