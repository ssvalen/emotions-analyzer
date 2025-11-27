<template>
  <div class="center-container">
    <div class="register-card">
      <img src="@/assets/img/logo.png" class="register-logo" />

      <h2 class="register-title">Restablecer Contraseña</h2>

      <p class="text-muted">
        Ingresa el código enviado a tu correo y tu nueva contraseña.
      </p>

      <div class="input-wrapper">
        <input
          v-model="codigo"
          type="text"
          placeholder="Código de verificación"
          class="input-box"
        />
        <p class="error">{{ codigoError }}</p>
      </div>

      <div class="input-wrapper">
        <input
          v-model="password"
          type="password"
          placeholder="Nueva contraseña"
          class="input-box"
        />
        <p class="error">{{ passwordError }}</p>
      </div>

      <div class="input-wrapper">
        <input
          v-model="password2"
          type="password"
          placeholder="Confirmar nueva contraseña"
          class="input-box"
        />
        <p class="error">{{ password2Error }}</p>
      </div>

      <button class="login-btn" :disabled="loading" @click="actualizarPassword">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Actualizar Contraseña</span>
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
import { ref, reactive, onMounted } from "vue";
import { authService } from "@/services/auth.js";
import { useRouter, useRoute } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    // FIX: leer email que viene desde query string
    const identifier = ref(route.query.email || ""); 
    
    const codigo = ref("");
    const password = ref("");
    const password2 = ref("");
    
    const codigoError = ref("");
    const passwordError = ref("");
    const password2Error = ref("");
    
    const loading = ref(false);

    const popup = reactive({
      show: false,
      title: "",
      message: "",
      callback: null
    });

    onMounted(() => {
      // si no viene el email, redirige
      if (!identifier.value) {
        router.push("/recuperar");
      }
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

    const validarCampos = () => {
      codigoError.value = "";
      passwordError.value = "";
      password2Error.value = "";

      let tieneErrores = false;

      if (!codigo.value.trim()) {
        codigoError.value = "Ingresa el código de verificación";
        tieneErrores = true;
      }

      if (!password.value) {
        passwordError.value = "Ingresa una contraseña";
        tieneErrores = true;
      } else if (password.value.length < 8) {
        passwordError.value = "Mínimo 8 caracteres";
        tieneErrores = true;
      }

      if (!password2.value) {
        password2Error.value = "Confirma tu contraseña";
        tieneErrores = true;
      } else if (password.value !== password2.value) {
        password2Error.value = "Las contraseñas no coinciden";
        tieneErrores = true;
      }

      return !tieneErrores;
    };

    const actualizarPassword = async () => {
      if (!validarCampos()) {
        mostrarPopup("Error", "Corrige los campos marcados");
        return;
      }

      loading.value = true;

      try {
        await authService.confirmPassword(
          identifier.value,
          codigo.value,
          password.value
        );

        mostrarPopup(
          "Contraseña actualizada",
          "Tu contraseña fue cambiada con éxito.",
          () => {
            router.push("/");
          }
        );
      } catch (err) {
        let mensaje = "Error al actualizar la contraseña";

        if (err.code === "CodeMismatchException") {
          mensaje = "Código de verificación incorrecto";
        } else if (err.code === "ExpiredCodeException") {
          mensaje = "El código ha expirado. Solicita uno nuevo";
        } else if (err.code === "InvalidPasswordException") {
          mensaje = "La contraseña no cumple con los requisitos";
        } else if (err.message) {
          mensaje = err.message;
        }

        mostrarPopup("Error", mensaje);
      } finally {
        loading.value = false;
      }
    };

    return {
      codigo,
      password,
      password2,
      codigoError,
      passwordError,
      password2Error,
      loading,
      popup,
      popupAccept,
      actualizarPassword,
      goLogin
    };
  }
};
</script>
