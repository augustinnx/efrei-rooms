<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute() // l'adresse de la page courante
const campuses = ref([])
const rooms = ref([])
const error = ref('')

// Le campus affiché : celui de l'adresse, sinon le premier de la liste
const currentId = computed(() => {
  if (route.params.id) return Number(route.params.id)
  return campuses.value.length ? campuses.value[0].id : null
})

// Le campus complet (pour afficher son nom)
const currentCampus = computed(() => campuses.value.find((c) => c.id === currentId.value))

// Charge les salles du campus affiché
async function loadRooms() {
  if (!currentId.value) return
  try {
    const response = await fetch(`http://localhost:3000/api/rooms?campusId=${currentId.value}`)
    if (!response.ok) throw new Error('Erreur serveur')
    rooms.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les salles.'
  }
}

// Au chargement de la page : on récupère la liste des campus
onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/rooms/campuses')
    if (!response.ok) throw new Error('Erreur serveur')
    campuses.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les campus.'
  }
})

// Quand le campus affiché change, on recharge ses salles
watch(currentId, loadRooms)
</script>

<template>
  <main class="container">
    <!-- Menu pour passer d'un campus à l'autre -->
    <nav class="tabs" aria-label="Campus">
      <RouterLink
        v-for="campus in campuses"
        :key="campus.id"
        :to="`/campuses/${campus.id}`"
        class="tab"
        :class="{ active: campus.id === currentId }"
      >
        {{ campus.name }}
      </RouterLink>
    </nav>

    <h1 v-if="currentCampus">{{ currentCampus.name }}</h1>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-else class="rooms-grid">
      <div v-for="room in rooms" :key="room.id" class="card room-card">
        <h2>{{ room.name }}</h2>
        <p>{{ room.capacity }} places</p>
      </div>
    </div>
  </main>
</template>