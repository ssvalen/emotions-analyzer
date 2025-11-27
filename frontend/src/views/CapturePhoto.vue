<template>
  <div id="app">
    <!-- Navbar - solo mostrar en rutas protegidas -->
    <Navbar v-if="showNavbar" />
    
    <!-- Contenido principal con padding-top cuando hay navbar -->
    <div :class="{ 'main-content': showNavbar, 'main-content-full': !showNavbar }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from '@/components/Navbar.vue';

const route = useRoute();

// Mostrar navbar solo en rutas protegidas (no en login, registro, etc.)
const showNavbar = computed(() => {
  return !route.meta.hideNavbar && route.meta.requiresAuth;
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
  position: relative;
}

/* Contenido principal con navbar */
.main-content {
  padding-top: 72px; /* Altura del navbar fijo */
  min-height: 100vh;
  width: 100%;
}

/* Contenido sin navbar (login, registro, etc) */
.main-content-full {
  min-height: 100vh;
  width: 100%;
}
</style>