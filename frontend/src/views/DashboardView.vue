<script setup>
import { ref, computed, onMounted } from 'vue'

const bookings = ref([])
const topSubjects = ref([])
const teachers = ref([])
const error = ref('')
const message = ref('')

async function load() {
  try {
    const response = await fetch('http://localhost:3000/api/bookings/upcoming', {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Erreur serveur')
    bookings.value = await response.json()
  } catch (e) {
    error.value = 'Impossible de charger les réservations.'
  }
}

// Le classement des matières et la liste des profs
async function loadExtras() {
  try {
    const stats = await fetch('http://localhost:3000/api/bookings/stats/subjects', {
      credentials: 'include',
    })
    if (stats.ok) topSubjects.value = await stats.json()

    const t = await fetch('http://localhost:3000/api/rooms/teachers')
    if (t.ok) teachers.value = await t.json()
  } catch (e) {
    // ces deux sections sont facultatives : on ignore l'erreur
  }
}

onMounted(() => {
  load()
  loadExtras()
})

const permanences = computed(() => bookings.value.filter((b) => b.type === 'permanence'))
const groups = computed(() => bookings.value.filter((b) => b.type !== 'permanence' && !b.isMine))

const typeLabels = { revision: 'Révision', chill: 'Détente', projet: 'Projet de groupe' }

// "2026-11-18" devient "mercredi 18 novembre"
function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

async function join(booking) {
  message.value = ''
  error.value = ''
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
  await load()
}
</script>

<template>
    <main class="page-bg container">
    <section class="welcome">
        <h1>Bienvenue sur EF'Rooms</h1>
        <p>
        Réserve une salle sur ton campus, dis ce que tu veux réviser et rejoins les
        groupes des autres étudiants pour travailler !
        </p>
        <RouterLink to="/campuses" class="btn">Je réserve une salle</RouterLink>
    </section>
    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <h2>Permanences de la semaine</h2>
    <p v-if="permanences.length === 0">Aucune permanence prévue cette semaine.</p>

    <div v-for="b in permanences" :key="b.id" class="card booking-item">
      <strong>Salle {{ b.Room.name }}</strong> · {{ b.Room.Campus.name }}
      <p>
        {{ formatDate(b.date) }}, de {{ b.startTime.slice(0, 5) }} à {{ b.endTime.slice(0, 5) }}
        <span v-if="b.Subject"> · {{ b.Subject.name }}</span>
      </p>
      <span v-if="b.isMine" class="badge">Créée par vous</span>
      <span v-else-if="b.myStatus" class="badge">Inscrit</span>
      <span v-else-if="b.taken >= b.maxParticipants" class="badge">Complet</span>
      <button v-else type="button" @click="join(b)">Rejoindre</button>
    </div>

    <h2>Groupes de révision</h2>
    <p v-if="groups.length === 0">Aucun groupe pour le moment. Sois le premier à en créer un !</p>

    <div v-for="b in groups" :key="b.id" class="card booking-item">
      <strong>Salle {{ b.Room.name }}</strong> · {{ b.Room.Campus.name }}
      <span class="badge">{{ b.taken }}/{{ b.maxParticipants }} places</span>
      <p>
        {{ formatDate(b.date) }}, de {{ b.startTime.slice(0, 5) }} à {{ b.endTime.slice(0, 5) }}
        · {{ typeLabels[b.type] }}
        <span v-if="b.Subject"> · {{ b.Subject.name }}</span>
      </p>
      <div class="progress" aria-hidden="true">
        <div class="progress-bar" :style="{ width: (b.taken / b.maxParticipants) * 100 + '%' }"></div>
      </div>
      <p v-if="b.description">{{ b.description }}</p>
      <p>Créé par {{ b.creator.firstName }}</p>

      <span v-if="b.myStatus" class="badge">Déjà rejoint</span>
      <span v-else-if="b.taken >= b.maxParticipants" class="badge">Complet</span>
      <button v-else type="button" @click="join(b)">Rejoindre</button>
    </div>

    <h2>Matières les plus réservées</h2>
    <p v-if="topSubjects.length === 0">Pas encore de statistiques.</p>
    <ol v-else class="top-list">
      <li v-for="s in topSubjects" :key="s.id">
        <span>{{ s.name }}</span>
        <span class="badge">{{ s.total }} réservation(s)</span>
      </li>
    </ol>
        <!-- Le bouton en bas de page qui mène à la liste des profs -->
    <div class="page-end">
      <RouterLink to="/teachers" class="btn">Contacter un professeur</RouterLink>
    </div>

  </main>
</template>