<script setup>
import { ref, onMounted } from 'vue'

const created = ref([])
const joined = ref([])
const quota = ref(null)
const error = ref('')
const message = ref('')

// La réservation en cours de modification (null = aucune) et ses champs
const editingId = ref(null)
const editForm = ref({ description: '' })

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
    quota.value = data.reservationQuota
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
  error.value = ''
  message.value = 'Réservation supprimée.'
  await load()
}

// Ouvre le mini-formulaire de modification
function startEdit(booking) {
  editingId.value = booking.id
  editForm.value = { description: booking.description || '' }
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
  error.value = ''
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
    <section class="subscription-summary card">
      <div>
        <strong>{{ quota && quota.isPremium ? 'Offre Pro active' : 'Offre gratuite' }}</strong>
        <p v-if="quota && !quota.isPremium">
          {{ quota.remaining }} réservation de salle restante cette semaine
          (renouvellement le {{ quota.weekStartsAt }}).
        </p>
        <p v-else-if="quota">Réservations de salles illimitées. Les groupes restent accessibles à tous.</p>
      </div>
      <RouterLink to="/plans" class="btn">{{ quota && quota.isPremium ? 'Mon abonnement' : 'Passer Pro' }}</RouterLink>
    </section>

    <h2>Mes salles réservées</h2>
    <p v-if="created.length === 0">Aucune réservation à venir.</p>

    <!-- Le conteneur permet de faire défiler le tableau sur un petit écran -->
    <div v-else class="table-wrapper">
      <table class="data-table">
        <caption class="sr-only">Mes réservations à venir</caption>
        <thead>
          <tr>
            <th scope="col">Salle</th>
            <th scope="col">Jour</th>
            <th scope="col">Horaires</th>
            <th scope="col">Motif</th>
            <th scope="col">Matière</th>
            <th scope="col">Groupe</th>
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
                <span class="badge">Ouvert</span>
              </td>
              <td>
                <button type="button" @click="startEdit(b)">Modifier</button>
                <button type="button" class="btn-secondary-button" @click="removeBooking(b)">Supprimer</button>
              </td>
            </tr>

            <!-- Ligne de modification, affichée seulement pour la réservation choisie -->
            <tr v-if="editingId === b.id" class="edit-row">
              <td colspan="7">
                <form @submit.prevent="saveEdit(b)">
                  <label :for="'desc' + b.id">Description</label>
                  <input :id="'desc' + b.id" type="text" maxlength="255" v-model="editForm.description" />

                  <div class="modal-buttons">
                    <button type="submit">Enregistrer</button>
                    <button type="button" class="btn-secondary-button" @click="editingId = null">Annuler</button>
                  </div>
                </form>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <h2>Les groupes que j'ai rejoints</h2>
    <p v-if="joined.length === 0">Vous n'avez rejoint aucun groupe.</p>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <caption class="sr-only">Les groupes que j'ai rejoints</caption>
        <thead>
          <tr>
            <th scope="col">Salle</th>
            <th scope="col">Jour</th>
            <th scope="col">Horaires</th>
            <th scope="col">Motif</th>
            <th scope="col">Matière</th>
            <th scope="col">Mon statut</th>
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
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>