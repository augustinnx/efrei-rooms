<script setup>
import { ref, computed, onMounted } from 'vue'
import emailLogo from '@/assets/mail.svg'

const teachers = ref([])
const error = ref('')
const loading = ref(true)
const search = ref('')
const selectedSubject = ref('')

// Les profs dont la photo est introuvable : on affiche leurs initiales à la place
const noPhoto = ref({})

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/rooms/teachers')
    if (!response.ok) throw new Error('Server error')
    teachers.value = await response.json()
  } catch (e) {
    error.value = 'Unable to load teachers.'
  } finally {
    loading.value = false
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

const subjects = computed(() =>
  [...new Set(teachers.value.map((teacher) => teacher.Subject.name))].sort()
)

const filteredTeachers = computed(() => {
  const query = search.value.trim().toLowerCase()
  return teachers.value.filter((teacher) => {
    const matchesSearch =
      !query ||
      teacher.name.toLowerCase().includes(query) ||
      teacher.Subject.name.toLowerCase().includes(query)
    const matchesSubject =
      !selectedSubject.value || teacher.Subject.name === selectedSubject.value
    return matchesSearch && matchesSubject
  })
})
</script>

<template>
  <main class="container teachers-page">
    <RouterLink to="/dashboard" class="back-link">← Back to dashboard</RouterLink>

    <header class="teachers-hero">
      <div>
        <p class="eyebrow">EFREI faculty</p>
        <h1>Contact a teacher</h1>
        <p>Find the right subject expert and reach out directly.</p>
      </div>
      <div class="teachers-count">
        <strong>{{ teachers.length }}</strong>
        <span>Teachers available</span>
      </div>
    </header>

    <div class="teacher-toolbar card">
      <label class="teacher-search">
        <span>Search</span>
        <input v-model="search" type="search" placeholder="Name or subject" />
      </label>
      <label class="teacher-filter">
        <span>Subject</span>
        <select v-model="selectedSubject">
          <option value="">All subjects</option>
          <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
        </select>
      </label>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading" class="teachers-loading" aria-live="polite">
      <div v-for="n in 3" :key="n" class="teacher-skeleton"></div>
    </div>

    <p v-else-if="filteredTeachers.length === 0" class="teacher-empty card">
      No teacher matches these filters.
    </p>

    <div v-else class="teachers-list">
      <article v-for="(teacher, index) in filteredTeachers" :key="teacher.id" class="card teacher-card">
        <div class="teacher-avatar">
          <img
            v-if="!noPhoto[teacher.id]"
            :src="`/teachers/${teacher.id}.jpg`"
            :alt="`Photo of ${teacher.name}`"
            @error="noPhoto[teacher.id] = true"
          />
          <span v-else class="teacher-initials">{{ initials(teacher.name) }}</span>
          <span class="teacher-status" title="Available by email"></span>
        </div>

        <div class="teacher-info">
          <p class="teacher-number">{{ String(index + 1).padStart(2, '0') }}</p>
          <h2>{{ teacher.name }}</h2>
          <span class="teacher-subject">{{ teacher.Subject.name }}</span>
        </div>

        <a
          class="teacher-email"
          :href="`mailto:${teacher.email}?subject=Question%20about%20${encodeURIComponent(teacher.Subject.name)}`"
          :title="`Contact ${teacher.name} by email`"
          :aria-label="`Contact ${teacher.name} by email`"
        >
          <img :src="emailLogo" alt="" />
          <span>Email teacher</span>
          <b aria-hidden="true">→</b>
        </a>
      </article>
    </div>
  </main>
</template>