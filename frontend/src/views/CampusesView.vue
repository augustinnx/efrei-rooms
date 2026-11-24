<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BookingModal from '../components/BookingModal.vue'

const route = useRoute()
const campuses = ref([])
const rooms = ref([])
const bookings = ref([])
const error = ref('')
const message = ref('')

// La salle sur laquelle on a cliqué (null = fenêtre fermée)
const selectedRoom = ref(null)

// Transforme une date en texte "AAAA-MM-JJ"
function toDateString(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const today = toDateString(new Date())
const limit = new Date()
limit.setDate(limit.getDate() + 7)
const maxDate = toDateString(limit)

// Le jour et l'heure affichés sur le plan
const planDate = ref(today)
const planHour = ref(Math.min(Math.max(new Date().getHours(), 8), 19))
const hours = Array.from({ length: 12 }, (_, i) => 8 + i) // de 8h à 19h

const typeLabels = { revision: 'Révision', chill: 'Détente', projet: 'Projet', permanence: 'Permanence' }

// Le campus affiché : celui de l'adresse, sinon le premier de la liste
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

// Les réservations du campus pour le jour choisi
async function loadBookings() {
  if (!currentId.value || !planDate.value) return
  try {
    const response = await fetch(
      `http://localhost:3000/api/bookings?campusId=${currentId.value}&date=${planDate.value}`,
      { credentials: 'include' }
    )
    if (!response.ok) throw new Error('Erreur serveur')
    bookings.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les réservations.'
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

// Quand le campus ou le jour change, on recharge
watch(currentId, () => {
  loadRooms()
  loadBookings()
})
watch(planDate, loadBookings)

function hourOf(time) {
  return parseInt(time.slice(0, 2), 10) // "09:00:00" devient 9
}

// Pour chaque salle, la réservation qui l'occupe à l'heure choisie (s'il y en a une)
const occupied = computed(() => {
  const map = {}
  for (const b of bookings.value) {
    if (planHour.value >= hourOf(b.startTime) && planHour.value < hourOf(b.endTime)) {
      map[b.roomId] = b
    }
  }
  return map
})

// La position de chaque salle sur le plan : première moitié en haut, seconde moitié en bas
const layout = computed(() => {
  const half = Math.ceil(rooms.value.length / 2)
  const width = half ? 660 / half : 0
  return rooms.value.map((room, i) => {
    const isTop = i < half
    const col = isTop ? i : i - half
    return {
      room,
      x: 20 + col * width,
      y: isTop ? 20 : 230,
      w: width,
      h: 130,
      booking: occupied.value[room.id] || null,
    }
  })
})

// Les réservations de groupe restent visibles dans leur couleur dédiée.
function stateOf(item) {
  if (!item.booking) return 'free'
  return item.booking.type === 'permanence' ? 'unavailable' : 'open'
}

// Coupe les textes trop longs pour qu'ils tiennent dans la salle
function short(text) {
  return text.length > 14 ? text.slice(0, 13) + '…' : text
}

function onRoomClick(item) {
  message.value = ''
  error.value = ''
  if (!item.booking) {
    selectedRoom.value = item.room // salle libre : on ouvre le formulaire
  } else if (item.booking.type !== 'permanence') {
    join(item.booking) // groupe ouvert : on le rejoint
  }
}

async function join(booking) {
  const response = await fetch(`http://localhost:3000/api/bookings/${booking.id}/join`, {
    method: 'POST',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    error.value = data.message
    return
  }
  message.value = `Vous avez rejoint la salle ${booking.Room.name}.`
}

// Appelée quand le formulaire dit "réservation créée"
function onCreated() {
  selectedRoom.value = null
  message.value = 'Réservation créée !'
  loadBookings() // le plan se met à jour
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

    <!-- Le jour et l'heure à afficher sur le plan -->
    <div class="plan-controls">
      <div>
        <label for="planDate">Jour</label>
        <input id="planDate" type="date" :min="today" :max="maxDate" v-model="planDate" />
      </div>
      <div>
        <label for="planHour">Heure</label>
        <select id="planHour" v-model.number="planHour">
          <option v-for="h in hours" :key="h" :value="h">{{ h }}h</option>
        </select>
      </div>
    </div>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Le plan du campus, dessiné en SVG -->
    <svg viewBox="0 0 700 380" class="plan" role="img" aria-label="Plan du campus">
      <!-- Le couloir au milieu -->
      <rect x="20" y="150" width="660" height="80" class="corridor" />
      <text x="350" y="195" class="corridor-label">Couloir</text>

      <!-- Une salle par élément de la liste -->
      <g
        v-for="item in layout"
        :key="item.room.id"
        class="room"
        :class="stateOf(item)"
        @click="onRoomClick(item)"
      >
        <rect :x="item.x" :y="item.y" :width="item.w" :height="item.h" class="room-rect" />
        <text :x="item.x + item.w / 2" :y="item.y + 30" class="room-name">{{ item.room.name }}</text>

        <!-- Si la salle est prise : les horaires et la matière -->
        <template v-if="item.booking">
          <text :x="item.x + item.w / 2" :y="item.y + 58" class="room-info">
            {{ hourOf(item.booking.startTime) }}h – {{ hourOf(item.booking.endTime) }}h
          </text>
          <text :x="item.x + item.w / 2" :y="item.y + 78" class="room-info">
            {{ short(item.booking.Subject ? item.booking.Subject.name : typeLabels[item.booking.type]) }}
          </text>
        </template>

      </g>
    </svg>

    <div class="legend">
      <span class="legend-item"><span class="legend-box free"></span> Disponible</span>
      <span class="legend-item"><span class="legend-box open"></span> Groupe ouvert : cliquer pour rejoindre</span>
      <span class="legend-item"><span class="legend-box busy"></span> Indisponible</span>
    </div>

    <!-- La fenêtre de réservation, affichée seulement si une salle est choisie -->
    <BookingModal
      v-if="selectedRoom"
      :room="selectedRoom"
      :initial-date="planDate"
      :initial-hour="planHour"
      @close="selectedRoom = null"
      @created="onCreated"
    />
  </main>
</template>