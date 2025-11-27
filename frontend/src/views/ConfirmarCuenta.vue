<template>
  <div class="center-container">
    <div class="register-card">
      <h2>Confirmar Cuenta</h2>

      <input v-model="codigo" placeholder="Código de verificación" class="input-box" />

      <p class="error">{{ error }}</p>

      <button class="login-btn" :disabled="loading" @click="confirmarCodigo">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Confirmar</span>
      </button>

      <p class="signup-text">
        ¿No recibiste el código?
        <span @click="reenviarCodigo">Reenviar</span>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { authService } from "@/services/auth.js";
import { useRouter } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const codigo = ref("");
    const loading = ref(false);
    const error = ref("");

    
    const username = sessionStorage.getItem("pending_verification_username");

    if (!username) {
      router.push("/");
    }

    const confirmarCodigo = async () => {
      error.value = "";
      loading.value = true;

      try {
        await authService.confirmRegistration(username, codigo.value);
        sessionStorage.removeItem("pending_verification_username");
        router.push("/");
      } catch (err) {
        error.value = err.message || "Código incorrecto";
      } finally {
        loading.value = false;
      }
    };

    const reenviarCodigo = async () => {
      try {
        await authService.resendConfirmationCode(username);
        error.value = "Código reenviado al correo.";
      } catch {
        error.value = "No se pudo reenviar el código.";
      }
    };

    return { codigo, error, loading, confirmarCodigo, reenviarCodigo };
  }
};
</script>
