<script setup>
import { RouterLink, RouterView } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <header class="topbar">
    <div class="container topbar-inner">
      <RouterLink to="/" class="brand">EFREI Rooms</RouterLink>
    </div>
  </header>

  <RouterView />

  <AppFooter />
</template>
