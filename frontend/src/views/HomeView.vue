<script setup>
import { ref, onMounted } from 'vue'

const campuses = ref([])
const error = ref('')

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/rooms/campuses')
    if (!response.ok) throw new Error('Erreur serveur')
    campuses.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les campus.'
  }
})
</script>

<template>
  <main class="container">
    <h1>Réservation de salles EFREI</h1>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-else class="grid">
      <div v-for="campus in campuses" :key="campus.id" class="card">
        <h2>{{ campus.name }}</h2>
      </div>
    </div>
  </main>
</template>