<script setup>
import { ref, onMounted } from 'vue'

const created = ref([])
const joined = ref([])
const quota = ref(null)
const error = ref('')
const message = ref('')

// La réservation en cours de modification (null = aucune) et ses champs
const editingId = ref(null)
const editForm = ref({ description: '', date: '', startTime: '', endTime: '' })
const savingEdit = ref(false)
const leavingId = ref(null)

function toDateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const editMinDate = toDateString(new Date())
const editDateLimit = new Date()
editDateLimit.setDate(editDateLimit.getDate() + 7)
const editMaxDate = toDateString(editDateLimit)

function formatExpiry(date) {
  if (!date) return ''
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const typeLabels = {
  revision: 'Study',
  chill: 'Relax',
  projet: 'Group project',
  permanence: 'Office hours',
}

const statusLabels = { accepted: 'Accepted', pending: 'Pending', refused: 'Declined' }

async function load() {
  try {
    const response = await fetch('http://localhost:3000/api/bookings/mine', {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Server error')
    const data = await response.json()
    created.value = data.created
    joined.value = data.joined
    quota.value = data.reservationQuota
  } catch (e) {
    error.value = 'Unable to load your bookings.'
  }
}

onMounted(load)

// DELETE : supprimer une réservation que j'ai créée
async function removeBooking(booking) {
  if (!confirm(`Delete the booking for room ${booking.Room.name}?`)) return
  const response = await fetch(`http://localhost:3000/api/bookings/${booking.id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    error.value = data.message
    return
  }
  error.value = ''
  message.value = 'Booking deleted.'
  await load()
}

// Ouvre le mini-formulaire de modification
function startEdit(booking) {
  editingId.value = booking.id
  error.value = ''
  editForm.value = {
    description: booking.description || '',
    date: booking.date,
    startTime: booking.startTime.slice(0, 5),
    endTime: booking.endTime.slice(0, 5),
  }
}

// PUT : enregistrer les modifications
async function saveEdit(booking) {
  error.value = ''
  savingEdit.value = true
  try {
    const response = await fetch(`http://localhost:3000/api/bookings/${booking.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm.value),
    })
    const data = await response.json()
    if (!response.ok) {
      error.value = data.message
      return
    }

    async function leaveGroup(booking) {
      if (!confirm(`Leave the group for room ${booking.Room.name}?`)) return
      leavingId.value = booking.id
      error.value = ''
      try {
        const response = await fetch(`http://localhost:3000/api/bookings/${booking.id}/leave`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await response.json()
        if (!response.ok) {
          error.value = data.message
          return
        }
        message.value = 'You left the group.'
        await load()
      } catch (e) {
        error.value = 'Unable to leave this group.'
      } finally {
        leavingId.value = null
      }
    }
    editingId.value = null
    message.value = 'Booking updated.'
    await load()
  } catch (e) {
    error.value = 'Unable to update this booking.'
  } finally {
    savingEdit.value = false
  }
}
</script>

<template>
  <main class="container">
    <h1>My bookings</h1>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
    <section class="subscription-summary card">
      <div>
        <strong>
          {{ quota && quota.isPremium ? `${quota.plan === 'yearly' ? 'Annual' : quota.plan === 'semester' ? '6-month' : quota.plan === 'monthly' ? 'Monthly' : 'Pro'} plan active` : 'Free plan' }}
        </strong>
        <p v-if="quota && !quota.isPremium">
          {{ quota.remaining }} room booking remaining this week
          (renewed on {{ quota.weekStartsAt }}).
        </p>
        <p v-else-if="quota && quota.isPremium">
          Unlimited room bookings<span v-if="quota.premiumUntil"> until {{ formatExpiry(quota.premiumUntil) }}</span>. Groups remain accessible to everyone.
        </p>
      </div>
      <RouterLink to="/plans" class="btn">{{ quota && quota.isPremium ? 'My subscription' : 'Upgrade to Pro' }}</RouterLink>
    </section>

    <h2>My reserved rooms</h2>
    <p v-if="created.length === 0">No upcoming bookings.</p>

    <!-- Le conteneur permet de faire défiler le tableau sur un petit écran -->
    <div v-else class="table-wrapper">
      <table class="data-table">
        <caption class="sr-only">My upcoming bookings</caption>
        <thead>
          <tr>
            <th scope="col">Room</th>
            <th scope="col">Day</th>
            <th scope="col">Time</th>
            <th scope="col">Purpose</th>
            <th scope="col">Subject</th>
            <th scope="col">Group</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Une ligne par réservation, plus une ligne de formulaire si on modifie -->
          <template v-for="b in created" :key="b.id">
            <tr>
              <td>{{ b.Room.name }}</td>
              <td>{{ b.date }}</td>
              <td>{{ b.startTime.slice(0, 5) }} – {{ b.endTime.slice(0, 5) }}</td>
              <td>{{ typeLabels[b.type] }}</td>
              <td>{{ b.Subject ? b.Subject.name : '—' }}</td>
              <td>
                <span class="badge">Open</span>
              </td>
              <td>
                <button type="button" @click="startEdit(b)">Edit</button>
                <button type="button" class="btn-secondary-button" @click="removeBooking(b)">Delete</button>
              </td>
            </tr>

            <!-- Ligne de modification, affichée seulement pour la réservation choisie -->
            <tr v-if="editingId === b.id" class="edit-row">
              <td colspan="7">
                <form @submit.prevent="saveEdit(b)">
                  <div class="booking-edit-fields">
                    <div>
                      <label :for="'date' + b.id">Date</label>
                      <input :id="'date' + b.id" type="date" :min="editMinDate" :max="editMaxDate" required v-model="editForm.date" />
                    </div>
                    <div>
                      <label :for="'start' + b.id">Start time</label>
                      <input :id="'start' + b.id" type="time" min="08:00" max="19:00" step="3600" required v-model="editForm.startTime" />
                    </div>
                    <div>
                      <label :for="'end' + b.id">End time</label>
                      <input :id="'end' + b.id" type="time" min="09:00" max="20:00" step="3600" required v-model="editForm.endTime" />
                    </div>
                    <div class="booking-edit-description">
                      <label :for="'desc' + b.id">Description</label>
                      <input :id="'desc' + b.id" type="text" maxlength="255" v-model="editForm.description" />
                    </div>
                  </div>

                  <div class="modal-buttons">
                    <button type="submit" :disabled="savingEdit">{{ savingEdit ? 'Saving…' : 'Save changes' }}</button>
                    <button type="button" class="btn-secondary-button" :disabled="savingEdit" @click="editingId = null">Cancel</button>
                  </div>
                </form>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <h2>Groups I joined</h2>
    <p v-if="joined.length === 0">You haven't joined any groups.</p>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <caption class="sr-only">Groups I joined</caption>
        <thead>
          <tr>
            <th scope="col">Room</th>
            <th scope="col">Day</th>
            <th scope="col">Time</th>
            <th scope="col">Purpose</th>
            <th scope="col">Subject</th>
            <th scope="col">My status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in joined" :key="b.id">
            <td>{{ b.Room.name }}</td>
            <td>{{ b.date }}</td>
            <td>{{ b.startTime.slice(0, 5) }} – {{ b.endTime.slice(0, 5) }}</td>
            <td>{{ typeLabels[b.type] }}</td>
            <td>{{ b.Subject ? b.Subject.name : '—' }}</td>
            <td><span class="badge">{{ statusLabels[b.myStatus] }}</span></td>
            <td>
              <button
                type="button"
                class="btn-danger-outline"
                :disabled="leavingId === b.id"
                @click="leaveGroup(b)"
              >
                {{ leavingId === b.id ? 'Leaving…' : 'Leave group' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>