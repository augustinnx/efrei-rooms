<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="topbar">
    <div class="container topbar-inner">
      <span class="brand">EFREI Rooms</span>
      <nav>
        <RouterLink to="/">Accueil</RouterLink>
        <RouterLink to="/register">Inscription</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>