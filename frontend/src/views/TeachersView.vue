<script setup>
import { ref, onMounted } from 'vue'

const teachers = ref([])
const error = ref('')

// Les profs dont la photo est introuvable : on affiche leurs initiales à la place
const noPhoto = ref({})

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/rooms/teachers')
    if (!response.ok) throw new Error('Erreur serveur')
    teachers.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les professeurs.'
  }
})

// "M. Dupont" devient "MD"
function initials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
</script>

<template>
  <main class="container">
    <RouterLink to="/dashboard">← Retour à l'accueil</RouterLink>
    <h1>Contacter un professeur</h1>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="teachers-list">
      <article v-for="t in teachers" :key="t.id" class="card teacher-card">
        <!-- Photo si elle existe, sinon un cercle avec les initiales -->
        <img
          v-if="!noPhoto[t.id]"
          :src="`/teachers/${t.id}.jpg`"
          :alt="`Photo de ${t.name}`"
          class="teacher-photo"
          @error="noPhoto[t.id] = true"
        />
        <div v-else class="teacher-photo teacher-initials" aria-hidden="true">
          {{ initials(t.name) }}
        </div>

        <div class="teacher-info">
          <h2>{{ t.name }}</h2>
          <p>{{ t.Subject.name }}</p>
          <a
            class="btn"
            :href="`mailto:${t.email}?subject=Question%20sur%20${encodeURIComponent(t.Subject.name)}`"
          >
            Contacter par email
          </a>
        </div>
      </article>
    </div>
  </main>
</template>