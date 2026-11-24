<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({ room: Object, initialDate: String, initialHour: Number })
const emit = defineEmits(['close', 'created'])

function toDateString(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const minDate = toDateString(new Date())
const limit = new Date()
limit.setDate(limit.getDate() + 7)
const maxDate = toDateString(limit)
const hours = Array.from({ length: 12 }, (_, i) => 8 + i)

const form = ref({
  date: props.initialDate || minDate,
  startHour: props.initialHour || 9,
  endHour: (props.initialHour || 9) + 1,
  type: 'revision',
  subjectId: '',
  maxParticipants: 10,
  description: '',
})

const subjects = ref([])
const bookings = ref([])
const error = ref('')
const loading = ref(false)
const loadingAvailability = ref(false)
const availabilityLoaded = ref(false)
const isAdmin = ref(false)
let availabilityRequest = 0

const roomBookings = computed(() =>
  bookings.value.filter((booking) => booking.roomId === props.room.id)
)

const availableDurations = computed(() => {
  const durations = []
  for (let duration = 1; form.value.startHour + duration <= 20; duration += 1) {
    const end = form.value.startHour + duration
    const overlaps = hours.some(
      (hour) =>
        hour >= form.value.startHour &&
        hour < end &&
        (bookingAt(hour) || isPast(hour))
    )
    if (overlaps) break
    durations.push(duration)
  }
  return durations
})

function hourOf(time) {
  return parseInt(time.slice(0, 2), 10)
}

function bookingAt(hour) {
  return roomBookings.value.find(
    (booking) => hour >= hourOf(booking.startTime) && hour < hourOf(booking.endTime)
  )
}

function isPast(hour) {
  if (form.value.date !== minDate) return false
  return hour <= new Date().getHours()
}

function slotState(hour) {
  if (isPast(hour)) return 'past'
  const booking = bookingAt(hour)
  if (!booking) return 'available'
  return booking.type === 'permanence' ? 'unavailable' : 'group'
}

function pad(hour) {
  return String(hour).padStart(2, '0') + ':00'
}

function selectSlot(hour) {
  if (slotState(hour) !== 'available') return
  form.value.startHour = hour
  form.value.endHour = hour + 1
}

function setDuration(duration) {
  form.value.endHour = form.value.startHour + duration
}

async function loadAvailability() {
  if (!form.value.date) return
  const requestId = ++availabilityRequest
  availabilityLoaded.value = false
  loadingAvailability.value = true
  try {
    const response = await fetch(
      `http://localhost:3000/api/bookings?date=${form.value.date}&campusId=${props.room.campusId}`,
      { credentials: 'include' }
    )
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Impossible de charger les disponibilités.')
    if (requestId !== availabilityRequest) return
    bookings.value = data
    availabilityLoaded.value = true
    if (!availableDurations.value.length || slotState(form.value.startHour) !== 'available') {
      const firstAvailable = hours.find((hour) => slotState(hour) === 'available')
      if (firstAvailable !== undefined) selectSlot(firstAvailable)
    }
    error.value = ''
  } catch (e) {
    if (requestId === availabilityRequest) {
      error.value = e.message || 'Impossible de charger les disponibilités.'
    }
  } finally {
    if (requestId === availabilityRequest) loadingAvailability.value = false
  }
}

watch(() => form.value.date, loadAvailability)

onMounted(async () => {
  loadAvailability()

  try {
    const response = await fetch('http://localhost:3000/api/rooms/subjects')
    if (!response.ok) throw new Error('Impossible de charger les matières.')
    subjects.value = await response.json()
  } catch (e) {
    error.value = e.message || 'Impossible de charger les matières.'
  }

  try {
    const me = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (me.ok) isAdmin.value = (await me.json()).role === 'admin'
  } catch (e) {
    isAdmin.value = false
  }
})

function validate() {
  const f = form.value
  if (!availabilityLoaded.value) return 'Les disponibilités ne sont pas encore chargées.'
  if (!f.date) return 'Choisissez une date.'
  const day = new Date(`${f.date}T12:00:00`).getDay()
  if (day === 0 || day === 6) return 'Réservation possible du lundi au vendredi.'
  if (f.endHour <= f.startHour) return "L'heure de fin doit être après l'heure de début."
  if ((f.type === 'revision' || f.type === 'permanence') && !f.subjectId) return 'Choisissez une matière.'
  if (f.maxParticipants < 1 || f.maxParticipants > props.room.capacity) {
    return `Le nombre de places doit être entre 1 et ${props.room.capacity}.`
  }
  if (!availableDurations.value.includes(f.endHour - f.startHour)) {
    return 'La durée choisie inclut un créneau indisponible.'
  }
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        roomId: props.room.id,
        date: form.value.date,
        startTime: pad(form.value.startHour),
        endTime: pad(form.value.endHour),
        type: form.value.type,
        visibility: 'open',
        maxParticipants: Number(form.value.maxParticipants),
        subjectId: form.value.subjectId || null,
        description: form.value.description,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      error.value = data.message
      return
    }

    emit('created')
  } catch (e) {
    error.value = 'Serveur injoignable.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal card" role="dialog" aria-modal="true">
      <h2>Réserver la salle {{ room.name }}</h2>

      <form @submit.prevent="submit">
        <label for="date">Jour</label>
        <input id="date" type="date" :min="minDate" :max="maxDate" v-model="form.date" />

        <fieldset class="availability">
          <legend>Disponibilités · {{ room.name }}</legend>
          <p class="availability-help">Choisissez une heure de début, puis la durée.</p>
          <div class="availability-grid" aria-label="Créneaux horaires de la salle">
            <button
              v-for="hour in hours"
              :key="hour"
              type="button"
              class="availability-slot"
              :class="[
                `is-${slotState(hour)}`,
                { 'is-selected': hour >= form.startHour && hour < form.endHour },
              ]"
              :disabled="loadingAvailability || slotState(hour) !== 'available'"
              :aria-label="`${pad(hour)} à ${pad(hour + 1)} ${
                slotState(hour) === 'available' ? 'disponible' :
                slotState(hour) === 'group' ? 'groupe ouvert' :
                slotState(hour) === 'past' ? 'heure passée' : 'indisponible'
              }`"
              @click="selectSlot(hour)"
            >
              {{ pad(hour) }}–{{ pad(hour + 1) }}
            </button>
          </div>
          <p v-if="loadingAvailability" class="availability-help">Chargement des créneaux…</p>
          <div class="legend availability-legend">
            <span class="legend-item"><span class="legend-box free"></span> Disponible</span>
            <span class="legend-item"><span class="legend-box open"></span> Groupe ouvert</span>
            <span class="legend-item"><span class="legend-box busy"></span> Indisponible</span>
          </div>
        </fieldset>

        <label>Durée · {{ pad(form.startHour) }}–{{ pad(form.endHour) }}</label>
        <div class="duration-options" aria-label="Durée de la réservation">
          <button
            v-for="duration in availableDurations"
            :key="duration"
            type="button"
            :class="{ 'duration-selected': form.endHour - form.startHour === duration }"
            @click="setDuration(duration)"
          >
            {{ duration }} h
          </button>
          <span v-if="availableDurations.length === 0" class="error">
            Aucun créneau libre après cette heure.
          </span>
        </div>

        <label for="type">Motif</label>
        <select id="type" v-model="form.type">
          <option value="revision">Révision</option>
          <option value="chill">Détente</option>
          <option value="projet">Projet de groupe</option>
          <option v-if="isAdmin" value="permanence">Permanence (admin)</option>
        </select>

        <template v-if="form.type === 'revision' || form.type === 'permanence'">
          <label for="subject">Matière</label>
          <select id="subject" v-model.number="form.subjectId">
            <option value="" disabled>Choisir une matière</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </template>

        <label for="max">Nombre de personnes (max {{ room.capacity }})</label>
        <input id="max" type="number" min="1" :max="room.capacity" v-model="form.maxParticipants" />

        <label for="description">Un mot pour les autres (facultatif)</label>
        <input id="description" type="text" maxlength="255" v-model="form.description" />

        <p v-if="error" class="error">{{ error }}</p>

        <div class="modal-buttons">
          <button type="submit" :disabled="loading || loadingAvailability || !availabilityLoaded">
            {{ loading ? 'Réservation...' : 'Réserver' }}
          </button>
          <button type="button" class="btn-secondary-button" @click="emit('close')">Annuler</button>
        </div>
      </form>
    </div>
  </div>
</template>
