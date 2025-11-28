<template>
  <div class="page-wrapper">
    <div class="page-content">
      <div class="container max-820">
        <h1 class="title center mt-title">Tomar Fotografía</h1>
        <p class="center subt">Colócate frente a la cámara en un lugar con buena iluminación.</p>

        <!-- Vista previa de la cámara -->
        <video 
          v-show="!photoTaken" 
          ref="videoElement" 
          class="video-preview" 
          autoplay 
          playsinline
        ></video>

        <!-- Foto tomada (preview) -->
        <img 
          v-show="photoTaken" 
          ref="previewImage" 
          class="preview-img" 
          alt="Foto capturada"
        />

        <!-- Botón para tomar foto -->
        <div v-if="!photoTaken" class="btn-center">
          <button 
            class="btn-upana" 
            @click="capturarFoto"
            :disabled="!cameraReady"
          >
            <span v-if="!cameraReady" class="spinner-btn"></span>
            <span v-else>Tomar Foto</span>
          </button>
        </div>

        <!-- Botones después de tomar la foto -->
        <div v-if="photoTaken" class="btn-group">
          <button class="btn-secondary" @click="retake">
            Tomar otra foto
          </button>
          <button class="btn-upana" @click="continuarConFoto" :disabled="loading">
            <span v-if="loading" class="spinner-btn"></span>
            <span v-else>Continuar</span>
          </button>
        </div>

        <!-- Canvas oculto para captura -->
        <canvas ref="canvasElement" hidden></canvas>
      </div>
    </div>

    <!-- Popup -->
    <div v-if="popup.show" class="popup">
      <div class="popup-content">
        <h3>{{ popup.title }}</h3>
        <p>{{ popup.message }}</p>
        <button class="popup-btn" @click="closePopup">Aceptar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import { getPresignedUrl, uploadFile } from '@/services/s3.js';

const router = useRouter();
const store = useUserStore();

// Referencias
const videoElement = ref(null);
const canvasElement = ref(null);
const previewImage = ref(null);

// Estado
const cameraReady = ref(false);
const photoTaken = ref(false);
const loading = ref(false);
const stream = ref(null);
const capturedBlob = ref(null);

const popup = reactive({
  show: false,
  title: '',
  message: ''
});

// Funciones
const mostrarPopup = (title, message) => {
  popup.title = title;
  popup.message = message;
  popup.show = true;
};

const closePopup = () => {
  popup.show = false;
};

const iniciarCamara = async () => {
  try {
    console.log('🎥 Solicitando acceso a la cámara...');
    
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user' // Cámara frontal
      },
      audio: false
    };

    stream.value = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
      
      // Esperar a que el video esté listo
      videoElement.value.onloadedmetadata = () => {
        cameraReady.value = true;
        console.log('✅ Cámara lista');
      };
    }
  } catch (err) {
    console.error('❌ Error al acceder a la cámara:', err);
    
    let mensaje = 'No se pudo acceder a la cámara.';
    
    if (err.name === 'NotAllowedError') {
      mensaje = 'Debes permitir el acceso a la cámara en tu navegador.';
    } else if (err.name === 'NotFoundError') {
      mensaje = 'No se encontró ninguna cámara en tu dispositivo.';
    } else if (err.name === 'NotReadableError') {
      mensaje = 'La cámara está siendo usada por otra aplicación.';
    }
    
    mostrarPopup('Error de Cámara', mensaje);
    cameraReady.value = false;
  }
};

const detenerCamara = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    console.log('🛑 Cámara detenida');
  }
};

const capturarFoto = () => {
  if (!cameraReady.value || !videoElement.value || !canvasElement.value) {
    return;
  }

  const video = videoElement.value;
  const canvas = canvasElement.value;
  
  // Configurar el canvas con las dimensiones del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Dibujar el frame actual del video en el canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convertir a imagen
  const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
  
  // Mostrar preview
  if (previewImage.value) {
    previewImage.value.src = imageDataUrl;
  }
  
  // Guardar en store
  store.setFotoBase64(imageDataUrl);
  
  // Convertir a Blob para subir
  canvas.toBlob((blob) => {
    capturedBlob.value = blob;
    photoTaken.value = true;
    detenerCamara();
    console.log('📸 Foto capturada');
  }, 'image/jpeg', 0.9);
};

const retake = () => {
  photoTaken.value = false;
  capturedBlob.value = null;
  store.setFotoBase64('');
  iniciarCamara();
};

const continuarConFoto = async () => {
  if (!capturedBlob.value) {
    mostrarPopup('Error', 'No hay foto para subir');
    return;
  }

  loading.value = true;

  try {
    console.log('⬆️ Subiendo foto...');
    
    // Crear un File object del Blob
    const fileName = `capture_${Date.now()}.jpg`;
    const file = new File([capturedBlob.value], fileName, { type: 'image/jpeg' });

    // Obtener URL presignada
    const { uploadUrl } = await getPresignedUrl(
      store.token,
      fileName,
      'image/jpeg'
    );

    // Subir archivo
    await uploadFile(uploadUrl, file);

    console.log('✅ Foto subida exitosamente');

    // Completar paso y continuar
    store.completeStep(3);
    router.push('/processing');

  } catch (err) {
    console.error('❌ Error al subir foto:', err);
    mostrarPopup('Error', err.message || 'Error al subir la foto. Intenta de nuevo.');
  } finally {
    loading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  iniciarCamara();
});

onBeforeUnmount(() => {
  detenerCamara();
});
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-content {
  width: 100%;
  min-height: calc(100vh - 72px);
  padding: 2rem 0;
}

.container {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1rem;
}

.max-820 {
  max-width: 820px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #003a79;
  margin-bottom: 0.5rem;
}

.center {
  text-align: center;
}

.mt-title {
  margin-top: 1rem;
}

.subt {
  color: #666;
  font-size: 1rem;
  margin-bottom: 2rem;
}

/* Video y preview */
.video-preview,
.preview-img {
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 2rem auto;
  display: block;
  background: #000;
}

.preview-img {
  object-fit: contain;
}

/* Botones */
.btn-center {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.btn-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.btn-upana,
.btn-secondary {
  padding: 12px 32px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  min-height: 48px;
}

.btn-upana {
  background: linear-gradient(135deg, #003a79 0%, #005aa7 100%);
  color: white;
}

.btn-upana:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 58, 121, 0.3);
}

.btn-upana:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
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

/* Popup */
.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.popup-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.popup-content h3 {
  color: #003a79;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.popup-content p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.popup-btn {
  padding: 10px 24px;
  background: #003a79;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.popup-btn:hover {
  background: #002a59;
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 1.5rem;
  }

  .subt {
    font-size: 0.9rem;
  }

  .btn-group {
    flex-direction: column;
    align-items: center;
  }

  .btn-upana,
  .btn-secondary {
    width: 100%;
    max-width: 300px;
  }

  .video-preview,
  .preview-img {
    margin: 1rem auto;
  }
}
</style>