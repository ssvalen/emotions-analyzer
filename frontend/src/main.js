import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { useUserStore } from '@/store/userStore.js';
import { authService } from '@/services/auth.js'; 

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const store = useUserStore();
initUser();
// Cargar sesión existente de forma segura
async function initUser() {
  try {
    const session = await authService.getUser();
    if (session) {
      store.setToken(session.id_token);
      store.setUser({ username: session.username }); 
      store.completeStep(1);
    }
  } catch (err) {
    console.warn("No hay sesión activa:", err);
  }
}



app.mount('#app');
