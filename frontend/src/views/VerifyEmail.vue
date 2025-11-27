<template>
  <div class="center-container">
    <div class="register-card">
      <img src="@/assets/img/logo.png" class="register-logo" />

      <h2 class="register-title">Verifica tu Correo</h2>

      <p class="text-muted">
        Hemos enviado un código de verificación a<br>
        <strong>{{ email }}</strong>
      </p>

      <div class="input-wrapper">
        <input
          v-model="codigo"
          type="text"
          placeholder="Código de verificación"
          class="input-box"
          maxlength="6"
        />
        <p class="error">{{ codigoError }}</p>
      </div>

      <button class="login-btn" :disabled="loading" @click="verificarCodigo">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Verificar</span>
      </button>

      <p class="signup-text">
        ¿No recibiste el código?
        <span @click="reenviarCodigo" :class="{ disabled: reenviarDisabled }">
          Reenviar {{ reenviarDisabled ? `(${countdown}s)` : '' }}
        </span>
      </p>

      <p class="signup-text">
        <span @click="goLogin">Volver al inicio de sesión</span>
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
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { authService } from "@/services/auth.js";
import { useRouter, useRoute } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    const email = ref(route.query.email || "");
    const codigo = ref("");
    const codigoError = ref("");
    const loading = ref(false);
    const reenviarDisabled = ref(false);
    const countdown = ref(60);
    
    let intervalId = null;

    const popup = reactive({
      show: false,
      title: "",
      message: "",
      callback: null
    });

    onMounted(() => {
      // Si no hay email, redirigir al registro
      if (!email.value) {
        router.push("/registro");
      }
    });

    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId);
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

    const iniciarContador = () => {
      reenviarDisabled.value = true;
      countdown.value = 60;
      
      intervalId = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(intervalId);
          reenviarDisabled.value = false;
        }
      }, 1000);
    };

    const verificarCodigo = async () => {
      codigoError.value = "";

      if (!codigo.value.trim()) {
        codigoError.value = "Ingresa el código de verificación";
        mostrarPopup("Error", "Ingresa el código recibido por correo");
        return;
      }

      loading.value = true;

      try {
        await authService.confirmRegistration(email.value, codigo.value);
        
        mostrarPopup(
          "¡Verificación exitosa!",
          "Tu cuenta ha sido verificada. Ahora puedes iniciar sesión.",
          () => {
            router.push("/");
          }
        );
      } catch (err) {
        let mensaje = "Error al verificar el código";

        if (err.code === "CodeMismatchException") {
          mensaje = "Código de verificación incorrecto";
        } else if (err.code === "ExpiredCodeException") {
          mensaje = "El código ha expirado. Solicita uno nuevo";
        } else if (err.code === "NotAuthorizedException") {
          mensaje = "Usuario ya verificado";
          mostrarPopup(mensaje, "Puedes iniciar sesión ahora", () => {
            router.push("/");
          });
          return;
        } else if (err.message) {
          mensaje = err.message;
        }

        mostrarPopup("Error", mensaje);
      } finally {
        loading.value = false;
      }
    };

    const reenviarCodigo = async () => {
      if (reenviarDisabled.value) return;

      loading.value = true;

      try {
        await authService.resendConfirmationCode(email.value);
        mostrarPopup("Código enviado", "Hemos reenviado el código a tu correo");
        iniciarContador();
      } catch (err) {
        let mensaje = "Error al reenviar el código";

        if (err.code === "LimitExceededException") {
          mensaje = "Demasiados intentos. Espera un momento";
        } else if (err.message) {
          mensaje = err.message;
        }

        mostrarPopup("Error", mensaje);
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      codigo,
      codigoError,
      loading,
      popup,
      reenviarDisabled,
      countdown,
      mostrarPopup,
      popupAccept,
      verificarCodigo,
      reenviarCodigo,
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
  line-height: 1.6;
}

.text-muted strong {
  color: #003a79;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
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