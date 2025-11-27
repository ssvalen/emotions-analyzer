<template>
  <div class="center-container">
    <div class="register-card">
      <img src="@/assets/img/logo.png" class="register-logo" />

      <h2 class="register-title">Crea tu Cuenta</h2>

      <div class="input-wrapper" v-for="field in fields" :key="field.id">
        <input
          :id="field.id"
          v-model="form[field.model]"
          :type="field.type"
          :placeholder="field.placeholder"
          class="input-box"
        />
        <p class="error">{{ errors[field.model] }}</p>
      </div>

      <button class="login-btn" :disabled="loading" @click="registrarUsuario">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Registrarse</span>
      </button>

      <p class="signup-text">
        ¿Ya tienes una cuenta?
        <span @click="goLogin">Iniciar sesión</span>
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

    const form = reactive({
      nombre: "",
      apPaterno: "",
      apMaterno: "",
      username: "",
      email: "",
      password: "",
      password2: ""
    });

    const errors = reactive({
      nombre: "",
      apPaterno: "",
      apMaterno: "",
      username: "",
      email: "",
      password: "",
      password2: ""
    });

    const loading = ref(false);

    const popup = reactive({ show: false, title: "", message: "", callback: null });

    const fields = [
      { id: "nombre", model: "nombre", placeholder: "Nombre completo", type: "text" },
      { id: "apPaterno", model: "apPaterno", placeholder: "Apellido paterno", type: "text" },
      { id: "apMaterno", model: "apMaterno", placeholder: "Apellido materno", type: "text" },
      { id: "username", model: "username", placeholder: "Username (alfanumérico)", type: "text" },
      { id: "email", model: "email", placeholder: "Correo electrónico", type: "email" },
      { id: "password", model: "password", placeholder: "Contraseña", type: "password" },
      { id: "password2", model: "password2", placeholder: "Confirmar contraseña", type: "password" }
    ];

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

    const registrarUsuario = async () => {
      // limpiar errores
      Object.keys(errors).forEach((k) => (errors[k] = ""));

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9._-]{4,16}$/;

      let tieneErrores = false;

      if (!form.nombre) { errors.nombre = "Ingresa tu nombre"; tieneErrores = true; }
      if (!form.apPaterno) { errors.apPaterno = "Ingresa tu apellido paterno"; tieneErrores = true; }
      if (!form.apMaterno) { errors.apMaterno = "Ingresa tu apellido materno"; tieneErrores = true; }

      if (!usernameRegex.test(form.username) || form.username.includes("@")) {
        errors.username = "4-16 caracteres, letras, números, . _ - (no puede ser email)";
        tieneErrores = true;
      }

      if (!emailRegex.test(form.email)) { errors.email = "Correo inválido"; tieneErrores = true; }
      if (!form.password) { errors.password = "Ingresa contraseña"; tieneErrores = true; }
      if (form.password !== form.password2) { errors.password2 = "Contraseñas no coinciden"; tieneErrores = true; }

      if (tieneErrores) {
        mostrarPopup("Error", "Corrige los campos marcados");
        return;
      }

      loading.value = true;

      try {
        await authService.register({
          email: form.email,
          password: form.password,
          username: form.username, 
          nombre: form.nombre,
          apellidos: `${form.apPaterno} ${form.apMaterno}`
        });

        mostrarPopup(
          "Registro exitoso", 
          "Tu cuenta fue creada. Verifica tu correo para confirmar tu cuenta.", 
          () => {
            sessionStorage.setItem('pending_verification_username', form.username);
            router.push("/confirmar");
          }
        );

      } catch (err) {
        let mensaje = "Ocurrió un error al registrar la cuenta";
        
        if (err.code === "UsernameExistsException") {
          mensaje = "El username o correo ya está registrado";
        } else if (err.code === "InvalidPasswordException") {
          mensaje = "La contraseña no cumple los requisitos mínimos";
        } else if (err.message) {
          mensaje = err.message;
        }
        
        mostrarPopup("Error", mensaje);
      } finally {
        loading.value = false;
      }
    };
    return { form, errors, fields, loading, popup, mostrarPopup, popupAccept, registrarUsuario, goLogin };
  }
};
</script>

<style scoped>
.spinner-btn {
  border: 3px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.popup {
  position: fixed; top: 0; left:0; width: 100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  background: rgba(0,0,0,0.4); z-index: 1000;
}
.popup-content { background:#fff; padding: 20px; border-radius: 10px; max-width: 400px; text-align:center; }
.popup-btn { margin-top: 15px; padding: 8px 20px; border:none; background:#003A79; color:#fff; border-radius:5px; cursor:pointer; }
</style>
