<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-left">
        <img src="@/assets/img/logo-white.png" alt="Logo" class="navbar-logo" />
        <span class="navbar-title">Detector de Emociones</span>
      </div>

      <div class="navbar-right">
        <div v-if="user" class="user-info">
          <span class="username">{{ displayName }}</span>
          <button @click="showLogoutConfirm = true" class="logout-btn" title="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div v-if="showLogoutConfirm" class="modal-overlay" @click="showLogoutConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>Cerrar Sesión</h3>
        <p>¿Estás seguro que deseas cerrar tu sesión?</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showLogoutConfirm = false">
            Cancelar
          </button>
          <button class="btn-confirm" @click="handleLogout" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { storeToRefs } from 'pinia';
import { authService } from '@/services/auth';
import wsClient from '@/services/websocket';

const router = useRouter();
const store = useUserStore();
const { user } = storeToRefs(store);

const showLogoutConfirm = ref(false);
const loading = ref(false);

const displayName = computed(() => {
  if (!user.value) return '';
  return user.value.name || user.value.preferred_username || user.value.username || 'Usuario';
});

const handleLogout = async () => {
  loading.value = true;
  
  try {
    // Desconectar WebSocket
    if (wsClient.isConnected()) {
      wsClient.disconnect();
      console.log('WebSocket desconectado');
    }

    // Cerrar sesión en Cognito
    authService.logout();
    console.log('Sesión de Cognito cerrada');

    // Limpiar store
    store.clearUser();
    console.log('Store limpiado');

    // Cerrar modal
    showLogoutConfirm.value = false;

    // Redirigir al login
    router.push('/');
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    store.clearUser();
    router.push('/');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #003a79 0%, #005aa7 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar-logo {
  height: 40px;
  width: auto;
}

.navbar-title {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  display: none;
}

@media (min-width: 640px) {
  .navbar-title {
    display: block;
  }
}

.navbar-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  display: none;
}

@media (min-width: 640px) {
  .username {
    display: block;
  }
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.logout-btn:active {
  transform: translateY(0);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content h3 {
  color: #003a79;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.modal-content p {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.95rem;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #dc3545;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-confirm:hover:not(:disabled) {
  background: #c82333;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>