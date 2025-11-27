<template>
  <div class="center-container">
    <div class="register-card">
      <img src="@/assets/img/logo.png" class="register-logo" />

      <h2 class="register-title">Recuperar Contraseña</h2>

      <p class="text-muted">
        Ingresa tu correo electrónico o username para recibir un código de verificación.
      </p>

      <div class="input-wrapper">
        <input 
          v-model="emailOrUsername" 
          type="text" 
          placeholder="Correo electrónico o username" 
          class="input-box" 
        />
        <p class="error">{{ emailError }}</p>
      </div>

      <button class="login-btn" :disabled="loading" @click.prevent="enviarCodigo">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Solicitar Código</span>
      </button>

      <p class="signup-text">
        Regresar a <span @click="goLogin">Iniciar Sesión</span>
      </p>
    </div>

    <div v-if="popup.show" class="popup">
      <div class="popup-content">
        <h3>{{ popup.title }}</h3>
        <p>{{ popup.message }}</p>
        <button class="popup-btn" @click="popupAccept">Aceptar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from "vue";
import { authService } from "@/services/auth.js";
import { useRouter } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const emailOrUsername = ref("");
    const emailError = ref("");
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

    const goLogin = () => router.push("/");

    const enviarCodigo = async () => {
      emailError.value = "";

      if (!emailOrUsername.value.trim()) {
        emailError.value = "Campo requerido";
        mostrarPopup("Error", "Ingresa un correo o username");
        return;
      }

      loading.value = true;

      try {
        await authService.forgotPassword(emailOrUsername.value);

        // Mostrar popup y navegar después de aceptar
        mostrarPopup(
          "Código enviado",
          "Revisa tu correo electrónico. Te enviamos un código de verificación.",
          () => {
            router.push({
              path: "/restablecer",
              query: { email: emailOrUsername.value }
            });
          }
        );

      } catch (err) {
        let mensaje = "Error al enviar el código";

        if (err.code === "UserNotFoundException") {
          mensaje = "No existe una cuenta con este dato";
        } else if (err.code === "LimitExceededException") {
          mensaje = "Demasiados intentos. Intenta más tarde";
        } else if (err.message) {
          mensaje = err.message;
        }

        mostrarPopup("Error", mensaje);
      } finally {
        loading.value = false;
      }
    };

    return {
      emailOrUsername,
      emailError,
      loading,
      popup,
      popupAccept,
      enviarCodigo,
      goLogin
    };
  }
};
</script>

<style scoped>
.text-muted {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
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
</style>
