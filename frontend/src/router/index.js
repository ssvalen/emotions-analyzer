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
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: { 
      public: true,
      hideNavbar: true,
      requiresAuth: false
    }
  },
  {
    path: '/registro',
    name: 'Register',
    component: Register,
    meta: { 
      public: true,
      hideNavbar: true,
      requiresAuth: false
    }
  },
  {
    path: '/recuperar',
    name: 'RecoverPassword',
    component: RecoverPassword,
    meta: { 
      public: true,
      hideNavbar: true,
      requiresAuth: false
    }
  },
  {
    path: '/restablecer',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { 
      public: true,
      hideNavbar: true,
      requiresAuth: false
    }
  },
  {
    path: "/confirmar",
    name: "Confirmar",
    component: ConfirmarCuenta,
    meta: { 
      public: true,
      hideNavbar: true,
      requiresAuth: false
    }
  },
  {
    path: '/callback',
    name: 'Callback',
    component: Callback,
    meta: {
      requiresAuth: true,
      hideNavbar: false
    }
  },
  {
    path: '/consent',
    name: 'Consent',
    component: Consent,
    meta: { 
      requiresAuth: true,
      hideNavbar: false,
      requiredStep: 1
    }
  },
  {
    path: '/upload',
    name: 'UploadPhoto',
    component: UploadPhoto,
    meta: { 
      requiresAuth: true,
      hideNavbar: false,
      requiredStep: 2
    }
  },
  {
    path: '/capture',
    name: 'CapturePhoto',
    component: CapturePhoto,
    meta: { 
      requiresAuth: true,
      hideNavbar: false,
      requiredStep: 2
    }
  },
  {
    path: '/processing',
    name: 'Processing',
    component: Processing,
    meta: { 
      requiresAuth: true,
      hideNavbar: false,
      requiredStep: 3
    }
  },
  {
    path: '/result',
    name: 'Result',
    component: Result,
    meta: { 
      requiresAuth: true,
      hideNavbar: false,
      requiredStep: 4
    }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: Activities,
    meta: { 
      requiresAuth: true,
      hideNavbar: false,
      requiredStep: 4
    }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const store = useUserStore();

  if (!store.user && !to.meta.public) {
    try {
      await store.loadUser();
    } catch (err) {
      console.warn("No hay sesión activa", err);
    }
  }

  if (to.meta.public) {
    if (store.user && to.path === '/') {
      return next('/consent');
    }
    return next();
  }

  if (!store.user) {
    return next('/');
  }

  const requiredStep = to.meta.requiredStep;

  if (requiredStep !== undefined) {
    if (store.stepCompleted < requiredStep) {
      const nextStep = store.stepCompleted;

      if (nextStep === 0 || nextStep === 1) return next('/consent');
      if (nextStep === 2) return next('/upload');
      if (nextStep === 3) return next('/processing');
      if (nextStep === 4) return next('/result');

      return next('/consent');
    }
  }

  next();
});

export default router;