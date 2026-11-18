<script setup>
import heroImage from '../assets/hero.svg'
</script>

<template>
  <main class="page-bg container">
    <section class="hero container">
      <div class="hero-text">
        <h1>EF'Rooms</h1>
        <p class="tagline">
          Trouve une salle libre, réserve-la et révise avec d'autres étudiants.
        </p>
        <p>
          Réserve une salle sur n'importe quel campus, dis ce que tu veux réviser
          et laisse les autres te rejoindre. Fini les couloirs à chercher une
          salle vide.
        </p>
        <div class="hero-buttons">
          <RouterLink to="/register" class="btn">Inscription</RouterLink>
          <RouterLink to="/login" class="btn btn-secondary">Connexion</RouterLink>
        </div>
      </div>

      <img :src="heroImage" alt="Planning de réservation de salles" class="hero-image" />
    </section>
  </main>
</template>