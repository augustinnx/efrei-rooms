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
    if (!response.ok) throw new Error('Server error')
    bookings.value = await response.json()
  } catch (e) {
    error.value = 'Unable to load bookings.'
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

const typeLabels = { revision: 'Study', chill: 'Relax', projet: 'Group project' }

// "2026-11-18" devient "mercredi 18 novembre"
function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
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
  message.value = `You joined room ${booking.Room.name}.`
  await load()
}
</script>

<template>
    <main class="page-bg container">
    <section class="welcome">
        <h1>Welcome to EF'Rooms</h1>
        <p>
        Book a room on your campus, share what you want to study, and join
        study groups with other students!
        </p>
        <RouterLink to="/campuses" class="btn">Book a room</RouterLink>
    </section>
    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <h2>This week's office hours</h2>
    <p v-if="permanences.length === 0">No office hours scheduled this week.</p>

    <div v-for="b in permanences" :key="b.id" class="card booking-item">
      <strong>Room {{ b.Room.name }}</strong> · {{ b.Room.Campus.name }}
      <p>
        {{ formatDate(b.date) }}, from {{ b.startTime.slice(0, 5) }} to {{ b.endTime.slice(0, 5) }}
        <span v-if="b.Subject"> · {{ b.Subject.name }}</span>
      </p>
      <span v-if="b.isMine" class="badge">Created by you</span>
      <span v-else-if="b.myStatus" class="badge">Registered</span>
      <span v-else-if="b.taken >= b.maxParticipants" class="badge">Full</span>
      <button v-else type="button" @click="join(b)">Join</button>
    </div>

    <h2>Study groups</h2>
    <p v-if="groups.length === 0">No groups at the moment. Be the first to create one!</p>

    <div v-for="b in groups" :key="b.id" class="card booking-item">
      <strong>Room {{ b.Room.name }}</strong> · {{ b.Room.Campus.name }}
      <span class="badge">{{ b.taken }}/{{ b.maxParticipants }} spots</span>
      <p>
        {{ formatDate(b.date) }}, from {{ b.startTime.slice(0, 5) }} to {{ b.endTime.slice(0, 5) }}
        · {{ typeLabels[b.type] }}
        <span v-if="b.Subject"> · {{ b.Subject.name }}</span>
      </p>
      <div class="progress" aria-hidden="true">
        <div class="progress-bar" :style="{ width: (b.taken / b.maxParticipants) * 100 + '%' }"></div>
      </div>
      <p v-if="b.description">{{ b.description }}</p>
      <p>Created by {{ b.creator.firstName }}</p>

      <span v-if="b.myStatus" class="badge">Already joined</span>
      <span v-else-if="b.taken >= b.maxParticipants" class="badge">Full</span>
      <button v-else type="button" @click="join(b)">Join</button>
    </div>

    <h2>Most-booked subjects</h2>
    <p v-if="topSubjects.length === 0">No statistics yet.</p>
    <ol v-else class="top-list">
      <li v-for="s in topSubjects" :key="s.id">
        <span>{{ s.name }}</span>
        <span class="badge">{{ s.total }} booking(s)</span>
      </li>
    </ol>
        <!-- Le bouton en bas de page qui mène à la liste des profs -->
    <div class="page-end">
      <RouterLink to="/teachers" class="btn">Contact a teacher</RouterLink>
    </div>

  </main>
</template>