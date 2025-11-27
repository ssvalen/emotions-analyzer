import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import RecoverPassword from '@/views/RecoverPassword.vue';
import ResetPassword from '@/views/ResetPassword.vue';
import Callback from '@/views/Callback.vue';
import Consent from '@/views/Consent.vue';
import UploadPhoto from '@/views/UploadPhoto.vue';
import CapturePhoto from '@/views/CapturePhoto.vue';
import Processing from '@/views/Processing.vue';
import Result from '@/views/Result.vue';
import Activities from '@/views/Activities.vue';
import { useUserStore } from '@/store/userStore.js';
import ConfirmarCuenta from '../views/ConfirmarCuenta.vue';

const routes = [
  // Rutas públicas (sin autenticación)
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/registro',
    name: 'Register',
    component: Register,
    meta: { public: true }
  },
  {
    path: '/recuperar',
    name: 'RecoverPassword',
    component: RecoverPassword,
    meta: { public: true }
  },
  {
    path: '/restablecer',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { public: true }
  },
  {
    path: "/confirmar",
    name: "Confirmar",
    component: ConfirmarCuenta,
    meta: { public: true}
  },

  // Rutas protegidas (requieren autenticación)
  {
    path: '/callback',
    name: 'Callback',
    component: Callback
  },
  {
    path: '/consent',
    name: 'Consent',
    component: Consent,
    meta: { requiredStep: 1 }
  },
  {
    path: '/upload',
    name: 'UploadPhoto',
    component: UploadPhoto,
    meta: { requiredStep: 2 }
  },
  {
    path: '/capture',
    name: 'CapturePhoto',
    component: CapturePhoto,
    meta: { requiredStep: 2 }
  },
  {
    path: '/processing',
    name: 'Processing',
    component: Processing,
    meta: { requiredStep: 3 }
  },
  {
    path: '/result',
    name: 'Result',
    component: Result,
    meta: { requiredStep: 4 }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: Activities,
    meta: { requiredStep: 4 } // Cambiar de 5 a 4 para que result pueda acceder
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const store = useUserStore();

  // Intentar cargar usuario si no está cargado
  if (!store.user && !to.meta.public) {
    try {
      await store.loadUser();
    } catch (err) {
      console.warn("No hay sesión activa", err);
    }
  }

  // Rutas públicas: permitir acceso sin autenticación
  if (to.meta.public) {
    // Si ya está autenticado y va al login, redirigir a consent
    if (store.user && to.path === '/') {
      return next('/consent');
    }
    return next();
  }

  // Rutas protegidas: verificar autenticación
  if (!store.user) {
    console.log('No hay usuario, redirigiendo a login');
    return next('/');
  }

  // Verificar si la ruta requiere un paso específico
  const requiredStep = to.meta.requiredStep;

  if (requiredStep !== undefined) {
    // Si el usuario no ha completado el paso requerido
    if (store.stepCompleted < requiredStep) {
      console.log(`Paso ${requiredStep} requerido, usuario en paso ${store.stepCompleted}`);

      // Redirigir al siguiente paso apropiado
      const nextStep = store.stepCompleted + 1;

      if (nextStep === 1) return next('/consent');
      if (nextStep === 2) return next('/upload');
      if (nextStep === 3) return next('/processing');
      if (nextStep === 4) return next('/result');

      return next('/'); // Fallback
    }
  }

  // Permitir la navegación
  next();
});

export default router;