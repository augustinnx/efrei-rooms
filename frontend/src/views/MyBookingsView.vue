<script setup>
import { ref, onMounted } from 'vue'

const created = ref([])
const joined = ref([])
const error = ref('')
const message = ref('')

// La réservation en cours de modification (null = aucune) et ses champs
const editingId = ref(null)
const editForm = ref({ description: '', visibility: 'open' })

const typeLabels = {
  revision: 'Révision',
  chill: 'Détente',
  projet: 'Projet de groupe',
  permanence: 'Permanence',
}

const statusLabels = { accepted: 'Acceptée', pending: 'En attente', refused: 'Refusée' }

async function load() {
  try {
    const response = await fetch('http://localhost:3000/api/bookings/mine', {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Erreur serveur')
    const data = await response.json()
    created.value = data.created
    joined.value = data.joined
  } catch (e) {
    error.value = 'Impossible de charger vos réservations.'
  }
}

onMounted(load)

// DELETE : supprimer une réservation que j'ai créée
async function removeBooking(booking) {
  if (!confirm(`Supprimer la réservation de la salle ${booking.Room.name} ?`)) return
  const response = await fetch(`http://localhost:3000/api/bookings/${booking.id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    error.value = data.message
    return
  }
  message.value = 'Réservation supprimée.'
  await load()
}

// Ouvre le mini-formulaire de modification
function startEdit(booking) {
  editingId.value = booking.id
  editForm.value = { description: booking.description || '', visibility: booking.visibility }
}

// PUT : enregistrer les modifications
async function saveEdit(booking) {
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
  editingId.value = null
  message.value = 'Réservation modifiée.'
  await load()
}
</script>

<template>
  <main class="container">
    <h1>Mes réservations</h1>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <h2>Mes salles réservées</h2>
    <p v-if="created.length === 0">Aucune réservation à venir.</p>

    <div v-for="b in created" :key="b.id" class="card booking-item">
      <div>
        <strong>Salle {{ b.Room.name }}</strong>
        <span class="badge">{{ b.visibility === 'open' ? 'Groupe ouvert' : 'Groupe privé' }}</span>
        <p>
          {{ b.date }} de {{ b.startTime.slice(0, 5) }} à {{ b.endTime.slice(0, 5) }}
          · {{ typeLabels[b.type] }}
          <span v-if="b.Subject"> · {{ b.Subject.name }}</span>
        </p>
        <p v-if="b.description">{{ b.description }}</p>
      </div>

      <!-- Mini-formulaire de modification, affiché seulement pour la réservation choisie -->
      <form v-if="editingId === b.id" @submit.prevent="saveEdit(b)">
        <label :for="'desc' + b.id">Description</label>
        <input :id="'desc' + b.id" type="text" maxlength="255" v-model="editForm.description" />

        <label :for="'vis' + b.id">Groupe</label>
        <select :id="'vis' + b.id" v-model="editForm.visibility">
          <option value="open">Ouvert</option>
          <option value="closed">Privé</option>
        </select>

        <div class="modal-buttons">
          <button type="submit">Enregistrer</button>
          <button type="button" class="btn-secondary-button" @click="editingId = null">Annuler</button>
        </div>
      </form>

      <div v-else class="modal-buttons">
        <button type="button" @click="startEdit(b)">Modifier</button>
        <button type="button" class="btn-secondary-button" @click="removeBooking(b)">Supprimer</button>
      </div>
    </div>

    <h2>Les groupes que j'ai rejoints</h2>
    <p v-if="joined.length === 0">Vous n'avez rejoint aucun groupe.</p>

    <div v-for="b in joined" :key="b.id" class="card booking-item">
      <strong>Salle {{ b.Room.name }}</strong>
      <span class="badge">{{ statusLabels[b.myStatus] }}</span>
      <p>
        {{ b.date }} de {{ b.startTime.slice(0, 5) }} à {{ b.endTime.slice(0, 5) }}
        · {{ typeLabels[b.type] }}
        <span v-if="b.Subject"> · {{ b.Subject.name }}</span>
      </p>
    </div>
  </main>
</template>