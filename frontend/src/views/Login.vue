<template>
  <div class="login-container">
    <!-- Panel izquierdo -->
    <div class="login-left">
      <img src="@/assets/img/logo.png" alt="Logo UPANA" class="login-logo">
      <h2>Iniciar Sesión</h2>

      <div class="input-wrapper">
        <input 
          v-model="email" 
          type="email" 
          class="input-box" 
          placeholder="Correo electrónico"
          @keyup.enter="login"
        />
        <p class="error">{{ emailError }}</p>
      </div>

      <div class="input-wrapper">
        <input 
          v-model="password" 
          type="password" 
          class="input-box" 
          placeholder="Contraseña"
          @keyup.enter="login"
        />
        <p class="error">{{ passwordError }}</p>
      </div>

      <div class="forgot signup-text">
        <span @click="goRecoverPassword">¿Olvidaste tu contraseña?</span>
      </div>

      <button class="login-btn" :disabled="loading" @click="login">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Ingresar</span>
      </button>

      <p class="signup-text">
        ¿No tienes una cuenta?
        <span @click="goRegister">Regístrate</span>
      </p>
    </div>

    <!-- Panel derecho -->
    <div class="login-right">
      <h1>WELCOME!</h1>
      <p>Conoce tu estado emocional con una foto.</p>
    </div>

    <!-- Popup -->
    <div v-if="popup.show" class="popup">
      <div class="popup-content">
        <h3>{{ popup.title }}</h3>
        <p>{{ popup.message }}</p>
        <button class="popup-btn" @click="popupAccept">Aceptar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/userStore";
import { authService } from "@/services/auth.js";

const email = ref("");
const password = ref("");
const emailError = ref("");
const passwordError = ref("");
const router = useRouter();
const store = useUserStore();
const loading = ref(false);

const popup = reactive({
  show: false,
  title: "",
  message: "",
  callback: null
});

const mostrarPopup = (title, message, callback = null) => {
  popup.title = title;
  popup.message = message;
  popup.callback = callback;
  popup.show = true;
};

const popupAccept = () => {
  popup.show = false;
  if (popup.callback) popup.callback();
};

const goRecoverPassword = () => {
  router.push("/recuperar");
};

const goRegister = () => {
  router.push("/registro");
};

onMounted(async () => {
  try {
    await store.loadUser();
    // Si ya hay usuario autenticado, redirigir
    if (store.user) {
      router.push("/consent");
    }
  } catch (err) {
    console.warn("No hay sesión activa", err);
  }
});

const validarCampos = () => {
  emailError.value = "";
  passwordError.value = "";

  let tieneErrores = false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    emailError.value = "Ingresa tu correo";
    tieneErrores = true;
  } else if (!emailRegex.test(email.value)) {
    emailError.value = "Correo inválido";
    tieneErrores = true;
  }

  if (!password.value) {
    passwordError.value = "Ingresa tu contraseña";
    tieneErrores = true;
  }

  return !tieneErrores;
};

const login = async () => {
  if (!validarCampos()) {
    mostrarPopup("Error", "Corrige los campos marcados");
    return;
  }

  loading.value = true;

  try {
    const result = await authService.login(email.value, password.value);
    
    // Guardar token y usuario en el store
    store.setToken(result.id_token);
    store.setUser({ 
      username: result.username,
      email: email.value 
    });
    
    // Guardar en localStorage
    localStorage.setItem("token", result.id_token);
    localStorage.setItem("user", JSON.stringify({ 
      username: result.username,
      email: email.value 
    }));
    
    store.completeStep(1);
    router.push("/consent");
    
  } catch (err) {
    let mensaje = "Error al iniciar sesión";

    if (err.code === "UserNotConfirmedException") {
      mensaje = "Debes verificar tu correo electrónico antes de iniciar sesión";
      mostrarPopup("Verificación pendiente", mensaje, () => {
        // Opcional: redirigir a una página de verificación
      });
      return;
    } else if (err.code === "NotAuthorizedException") {
      mensaje = "Correo o contraseña incorrectos";
    } else if (err.code === "UserNotFoundException") {
      mensaje = "No existe una cuenta con este correo";
    } else if (err.message) {
      mensaje = err.message;
    }

    mostrarPopup("Error", mensaje);
  } finally {
    loading.value = false;
  }
};
</script>

<style src="@/assets/css/login.css"></style>

<style scoped>
.error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  min-height: 18px;
}

.spinner-btn {
  border: 3px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.popup-content {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  text-align: center;
}

.popup-btn {
  margin-top: 15px;
  padding: 8px 20px;
  border: none;
  background: #003a79;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
}

.popup-btn:hover {
  background: #002a59;
}
</style>