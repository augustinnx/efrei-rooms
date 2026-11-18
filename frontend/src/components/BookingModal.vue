<script setup>
import { ref, onMounted } from 'vue'

// props = ce que le parent nous donne ; emit = ce qu'on lui renvoie
const props = defineProps({ room: Object, initialDate: String, initialHour: Number })
const emit = defineEmits(['close', 'created'])

// Transforme une date en texte "AAAA-MM-JJ"
function toDateString(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// Dates autorisées : d'aujourd'hui à dans 7 jours
const minDate = toDateString(new Date())
const limit = new Date()
limit.setDate(limit.getDate() + 7)
const maxDate = toDateString(limit)

// Heures possibles : début de 8h à 19h, fin de 9h à 20h
const startHours = Array.from({ length: 12 }, (_, i) => 8 + i)
const endHours = Array.from({ length: 12 }, (_, i) => 9 + i)

const form = ref({
    date: props.initialDate || minDate,
  startHour: props.initialHour || 9,
  endHour: (props.initialHour || 9) + 1,
  type: 'revision',
  subjectId: '',
  maxParticipants: 10,
  visibility: 'open',
  description: '',
})

const subjects = ref([])
const error = ref('')
const loading = ref(false)

const isAdmin = ref(false)

onMounted(async () => {
  // On récupère les matières pour la liste déroulante
  try {
    const response = await fetch('http://localhost:3000/api/rooms/subjects')
    subjects.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les matières.'
  }

  // On demande qui est connecté, pour savoir s'il est admin
  try {
    const me = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (me.ok) isAdmin.value = (await me.json()).role === 'admin'
  } catch (e) {
    isAdmin.value = false
  }
})

function pad(hour) {
  return String(hour).padStart(2, '0') + ':00'
}

// Validation côté CLIENT
function validate() {
  const f = form.value
  if (!f.date) return 'Choisissez une date.'
  const day = new Date(`${f.date}T12:00:00`).getDay()
  if (day === 0 || day === 6) return 'Réservation possible du lundi au vendredi.'
  if (f.endHour <= f.startHour) return "L'heure de fin doit être après l'heure de début."
  if ((f.type === 'revision' || f.type === 'permanence') && !f.subjectId) return 'Choisissez une matière.'
  if (f.maxParticipants < 1 || f.maxParticipants > props.room.capacity) {
    return `Le nombre de places doit être entre 1 et ${props.room.capacity}.`
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
        visibility: form.value.visibility,
        maxParticipants: Number(form.value.maxParticipants),
        subjectId: form.value.subjectId || null,
        description: form.value.description,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      error.value = data.message // erreur du serveur (conflit, règle...)
      return
    }

    emit('created') // on prévient le parent que c'est réussi
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

        <label for="startHour">De</label>
        <select id="startHour" v-model.number="form.startHour">
          <option v-for="h in startHours" :key="h" :value="h">{{ h }}h</option>
        </select>

        <label for="endHour">À</label>
        <select id="endHour" v-model.number="form.endHour">
          <option v-for="h in endHours" :key="h" :value="h">{{ h }}h</option>
        </select>

        <label for="type">Motif</label>
        <select id="type" v-model="form.type">
          <option value="revision">Révision</option>
          <option value="chill">Détente</option>
          <option value="projet">Projet de groupe</option>
          <option v-if="isAdmin" value="permanence">Permanence (admin)</option>
        </select>

        <!-- La matière n'apparaît que pour une révision -->
        <template v-if="form.type === 'revision' || form.type === 'permanence'">
          <label for="subject">Matière</label>
          <select id="subject" v-model.number="form.subjectId">
            <option value="" disabled>Choisir une matière</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </template>

        <label for="max">Nombre de personnes (max {{ room.capacity }})</label>
        <input id="max" type="number" min="1" :max="room.capacity" v-model="form.maxParticipants" />

        <label for="visibility">Groupe</label>
        <select id="visibility" v-model="form.visibility">
          <option value="open">Ouvert : tout le monde peut rejoindre</option>
          <option value="closed">Privé : sur demande</option>
        </select>

        <label for="description">Un mot pour les autres (facultatif)</label>
        <input id="description" type="text" maxlength="255" v-model="form.description" />

        <p v-if="error" class="error">{{ error }}</p>

        <div class="modal-buttons">
          <button type="submit" :disabled="loading">
            {{ loading ? 'Réservation...' : 'Réserver' }}
          </button>
          <button type="button" class="btn-secondary-button" @click="emit('close')">Annuler</button>
        </div>
      </form>
    </div>
  </div>
</template>