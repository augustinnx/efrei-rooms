<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BookingModal from '../components/BookingModal.vue'

const route = useRoute()
const campuses = ref([])
const rooms = ref([])
const error = ref('')

// La salle sur laquelle on a cliqué (null = fenêtre fermée)
const selectedRoom = ref(null)
const message = ref('')

const currentId = computed(() => {
  if (route.params.id) return Number(route.params.id)
  return campuses.value.length ? campuses.value[0].id : null
})

const currentCampus = computed(() => campuses.value.find((c) => c.id === currentId.value))

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

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/rooms/campuses')
    if (!response.ok) throw new Error('Erreur serveur')
    campuses.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les campus.'
  }
})

watch(currentId, loadRooms)

// Appelée quand la fenêtre dit "réservation créée"
function onCreated() {
  selectedRoom.value = null
  message.value = 'Réservation créée !'
}
</script>

<template>
  <main class="container">
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

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-else class="rooms-grid">
      <div
        v-for="room in rooms"
        :key="room.id"
        class="card room-card clickable"
        @click="selectedRoom = room; message = ''"
      >
        <h2>{{ room.name }}</h2>
        <p>{{ room.capacity }} places</p>
      </div>
    </div>

    <!-- La fenêtre de réservation, affichée seulement si une salle est choisie -->
    <BookingModal
      v-if="selectedRoom"
      :room="selectedRoom"
      @close="selectedRoom = null"
      @created="onCreated"
    />
  </main>
</template>