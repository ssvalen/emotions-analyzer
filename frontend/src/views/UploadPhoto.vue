<template>
  <div class="container max-820">
    <h1 class="center title">Hola, {{ userName }}</h1>
    <p class="center subt">Selecciona cómo deseas proporcionar tu fotografía.</p>

    <div class="grid-2 gap-28">
      <div class="card card-click" @click="goCapture">
        <div class="icon-card bg-primary">
          <span class="material-symbols-outlined">photo_camera</span>
        </div>
        <h3>Tomar foto con cámara</h3>
        <p>Usa la cámara de tu dispositivo en tiempo real.</p>
      </div>

      <div class="card card-click" @click="fileInput.click()">
        <div class="icon-card bg-secondary">
          <span class="material-symbols-outlined">upload</span>
        </div>
        <h3>Subir foto desde dispositivo</h3>
        <p>Selecciona una fotografía almacenada.</p>
        <input type="file" ref="fileInput" hidden @change="fotoSubida" accept="image/*" />
      </div>
    </div>

    <!-- Mensaje de éxito o error -->
    <transition name="fade">
      <div v-if="fotoCargada" class="upload-success">
        <span class="material-symbols-outlined success-icon">check_circle</span>
        <p>Foto cargada exitosamente</p>
      </div>
      <div v-else-if="errorMsg" class="upload-error">
        <span class="material-symbols-outlined error-icon">error</span>
        <p>{{ errorMsg }}</p>
      </div>
    </transition>

    <div class="btn-center">
      <button class="btn-upana" :disabled="loading" @click="continuar">
        <span v-if="loading" class="spinner-btn"></span>
        <span v-else>Continuar</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { getPresignedUrl, uploadFile } from '@/services/s3.js';

export default {
  setup() {
    const fileInput = ref(null);
    const fotoCargada = ref(false);
    const fileSelected = ref(null);
    const loading = ref(false);
    const errorMsg = ref('');
    const store = useUserStore();
    const router = useRouter();

    const userName = computed(() => store.user?.name || "estudiante");

    const fotoSubida = (event) => {
      errorMsg.value = '';
      const file = event.target.files[0];
      if (!file) return;

      // Validación de tipo de archivo
      if (!file.type.startsWith("image/")) {
        errorMsg.value = "Solo se permiten imágenes (JPG, PNG, WEBP).";
        fileSelected.value = null;
        fotoCargada.value = false;
        return;
      }

      fileSelected.value = file;

      const reader = new FileReader();
      reader.onload = () => {
        store.setFotoBase64(reader.result);
        fotoCargada.value = true;
        errorMsg.value = '';
      };
      reader.readAsDataURL(file);
    };

    const goCapture = () => router.push('/capture');

    const continuar = async () => {
      if (!fotoCargada.value || !fileSelected.value) {
        return alert("Debes subir o tomar una foto primero.");
      }

      loading.value = true;

      try {
        const { uploadUrl } = await getPresignedUrl(
          store.token,
          fileSelected.value.name,
          fileSelected.value.type
        );

        await uploadFile(uploadUrl, fileSelected.value);

        store.completeStep(3);
        router.push('/processing');
      } catch (err) {
        console.error(err);
        alert(err.message || "Ocurrió un error al subir la foto.");
      } finally {
        loading.value = false;
      }
    };

    return { fileInput, fotoSubida, continuar, goCapture, userName, fotoCargada, loading, errorMsg };
  }
};
</script>

<style scoped>
.upload-success, .upload-error {
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
}

.success-icon {
  font-size: 28px;
  color: #2ecc71;
}

.upload-error .error-icon {
  font-size: 28px;
  color: #d32f2f;
}

.upload-error p {
  color: #d32f2f;
  margin: 0;
}

.btn-upana {
  position: relative;
  background: #003A79;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-upana:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-btn {
  border: 3px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
