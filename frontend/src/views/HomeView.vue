<script setup>
import heroImage from '../assets/hero.svg'
</script>

<template>
  <main class="page-bg container">
    <section class="hero container">
      <div class="hero-text">
        <h1>EF'Rooms</h1>
        <p class="tagline">
          Find a free room, book it, and study with other students.
        </p>
        <p>
          Book a room at any campus, share what you want to study,
          and let others join you. No more wandering the corridors
          looking for an empty room.
        </p>
        <div class="hero-buttons">
          <RouterLink to="/register" class="btn">Sign up</RouterLink>
          <RouterLink to="/login" class="btn btn-secondary">Log in</RouterLink>
        </div>
      </div>

      <img :src="heroImage" alt="Room booking schedule" class="hero-image" />
    </section>
  </main>
</template>