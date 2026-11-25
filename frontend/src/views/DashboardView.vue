<script setup>
import { ref, computed, onMounted } from 'vue'

const bookings = ref([])
const topSubjects = ref([])
const teachers = ref([])
const error = ref('')
const message = ref('')
const loading = ref(true)
const refreshing = ref(false)
const joiningId = ref(null)
const userName = ref('')

const now = new Date()
const greeting = computed(() => {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

async function loadAccount() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
    if (response.ok) {
      const account = await response.json()
      userName.value = account.firstName
    }
  } catch (e) {
    // The dashboard remains usable if account details fail to load.
  }
}

async function load() {
  if (!loading.value) refreshing.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/bookings/upcoming', {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Server error')
    bookings.value = await response.json()
  } catch (e) {
    error.value = 'Unable to load bookings.'
  } finally {
    loading.value = false
    refreshing.value = false
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
  loadAccount()
  load()
  loadExtras()
})

const permanences = computed(() => bookings.value.filter((b) => b.type === 'permanence'))
const groups = computed(() => bookings.value.filter((b) => b.type !== 'permanence' && !b.isMine))
const mine = computed(() => bookings.value.filter((b) => b.isMine))

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
  joiningId.value = booking.id
  try {
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
  } catch (e) {
    error.value = 'Unable to join this group.'
  } finally {
    joiningId.value = null
  }
}
</script>

<template>
  <main class="page-bg dashboard-page">
    <div class="dashboard-shell">
      <section class="dashboard-hero">
        <div>
          <p class="eyebrow">{{ greeting }}</p>
          <h1>{{ userName ? `Welcome back, ${userName}` : 'Welcome back' }}</h1>
          <p class="dashboard-subtitle">Find a room, join a study group, and make the most of your campus.</p>
        </div>
        <div class="dashboard-actions">
          <button type="button" class="icon-action" :disabled="refreshing" :class="{ spinning: refreshing }" @click="load" aria-label="Refresh dashboard">
            ↻
          </button>
          <RouterLink to="/campuses" class="btn primary-action">
            <span aria-hidden="true">＋</span> Book a room
          </RouterLink>
        </div>
      </section>

      <p v-if="message" class="dashboard-notice success-notice">{{ message }}</p>
      <p v-if="error" class="dashboard-notice error-notice">{{ error }}</p>

      <div v-if="loading" class="dashboard-loading" aria-live="polite">
        <div class="skeleton skeleton-title"></div>
        <div class="dashboard-grid">
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        </div>
      </div>

      <div v-else class="dashboard-grid">
        <section class="dashboard-main">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Your week</p>
              <h2>Upcoming activity</h2>
            </div>
            <RouterLink to="/my-bookings" class="text-link">View all →</RouterLink>
          </div>

          <article v-if="mine.length" class="next-booking card">
            <div class="next-booking-accent"></div>
            <div class="next-booking-time">
              <span>{{ mine[0].date.slice(-2) }}</span>
              <small>{{ formatDate(mine[0].date).split(',')[0] }}</small>
            </div>
            <div class="next-booking-info">
              <span class="status-dot"></span>
              <p class="booking-kicker">Your next booking</p>
              <h3>Room {{ mine[0].Room.name }} · {{ mine[0].Room.Campus.name }}</h3>
              <p>{{ mine[0].startTime.slice(0, 5) }} – {{ mine[0].endTime.slice(0, 5) }}</p>
            </div>
            <RouterLink to="/my-bookings" class="round-arrow" aria-label="Open my bookings">→</RouterLink>
          </article>
          <article v-else class="empty-state card">
            <div class="empty-icon" aria-hidden="true">⌂</div>
            <div>
              <h3>No booking yet</h3>
              <p>Start by choosing an available room on your campus.</p>
            </div>
            <RouterLink to="/campuses" class="btn">Find a room</RouterLink>
          </article>

          <div class="section-heading groups-heading">
            <div>
              <p class="eyebrow">Collaborate</p>
              <h2>Study groups</h2>
            </div>
            <span class="count-badge">{{ groups.length }}</span>
          </div>

          <p v-if="groups.length === 0" class="inline-empty">No study groups are available yet. Be the first to create one.</p>

          <article v-for="b in groups.slice(0, 4)" :key="b.id" class="group-card card">
            <div class="group-card-top">
              <div class="subject-icon" aria-hidden="true">{{ (b.Subject ? b.Subject.name : typeLabels[b.type]).charAt(0) }}</div>
              <div class="group-card-title">
                <span>{{ b.Subject ? b.Subject.name : typeLabels[b.type] }}</span>
                <h3>Room {{ b.Room.name }}</h3>
              </div>
              <span class="group-type">{{ typeLabels[b.type] }}</span>
            </div>
            <p class="group-meta">{{ formatDate(b.date) }} · {{ b.startTime.slice(0, 5) }}–{{ b.endTime.slice(0, 5) }}</p>
            <p v-if="b.description" class="group-description">{{ b.description }}</p>
            <div class="group-footer">
              <div class="group-capacity">
                <div class="avatar-stack" aria-hidden="true">
                  <span>{{ b.creator.firstName.charAt(0) }}</span>
                  <span v-if="b.taken > 1">+{{ b.taken - 1 }}</span>
                </div>
                <span>{{ b.taken }}/{{ b.maxParticipants }} spots</span>
              </div>
              <button
                v-if="!b.myStatus"
                type="button"
                class="join-button"
                :disabled="b.taken >= b.maxParticipants || joiningId === b.id"
                @click="join(b)"
              >
                {{ joiningId === b.id ? 'Joining…' : b.taken >= b.maxParticipants ? 'Full' : 'Join group' }}
              </button>
              <span v-else class="joined-state">Joined</span>
            </div>
          </article>

          <div v-if="permanences.length" class="section-heading office-heading">
            <div>
              <p class="eyebrow">Get help</p>
              <h2>Teacher office hours</h2>
            </div>
          </div>
          <article v-for="b in permanences.slice(0, 3)" :key="b.id" class="office-card card">
            <div>
              <h3>Room {{ b.Room.name }}</h3>
              <p>{{ formatDate(b.date) }} · {{ b.startTime.slice(0, 5) }}–{{ b.endTime.slice(0, 5) }}</p>
              <span v-if="b.Subject" class="subject-pill">{{ b.Subject.name }}</span>
            </div>
            <button v-if="!b.isMine && !b.myStatus" type="button" class="join-button" :disabled="joiningId === b.id" @click="join(b)">
              {{ joiningId === b.id ? 'Joining…' : 'Register' }}
            </button>
            <span v-else-if="b.myStatus" class="joined-state">Registered</span>
          </article>
        </section>

        <aside class="dashboard-sidebar">
          <section class="sidebar-card card">
            <div class="sidebar-heading">
              <div>
                <p class="eyebrow">This week</p>
                <h2>At a glance</h2>
              </div>
            </div>
            <div class="stat-grid">
              <div><strong>{{ mine.length }}</strong><span>My bookings</span></div>
              <div><strong>{{ groups.length }}</strong><span>Open groups</span></div>
              <div><strong>{{ permanences.length }}</strong><span>Office hours</span></div>
              <div><strong>{{ topSubjects.length }}</strong><span>Subjects</span></div>
            </div>
          </section>

          <section v-if="topSubjects.length" class="sidebar-card card">
            <p class="eyebrow">Trending</p>
            <h2>Popular subjects</h2>
            <ol class="popular-list">
              <li v-for="(subject, index) in topSubjects.slice(0, 5)" :key="subject.id">
                <span class="rank">{{ index + 1 }}</span>
                <span class="popular-name">{{ subject.name }}</span>
                <span class="popular-count">{{ subject.total }}</span>
              </li>
            </ol>
          </section>

          <section class="sidebar-card contact-card">
            <p class="eyebrow">Need help?</p>
            <h2>Talk to a teacher</h2>
            <p>Contact a faculty member directly.</p>
            <RouterLink to="/teachers" class="contact-card-link">
              <span>Browse teachers</span>
              <b aria-hidden="true">→</b>
            </RouterLink>
          </section>

          <article class="fake-ad card" aria-label="Sponsored advertisement">
            <span class="ad-label">ADVERTISEMENT</span>
            <h2>Study smarter</h2>
            <p>Upgrade your focus with a distraction-free workspace.</p>
            <a href="#" @click.prevent>Discover FocusSpace</a>
          </article>
        </aside>
      </div>
    </div>
  </main>
</template>