<template>
  <div class="processing-wrapper">
    
    <!-- Loader y animación, se oculta si hay error -->
    <div class="loader-box" v-if="!error">
      <div class="scan-circle"></div>
      <div class="spinner"></div>
    </div>

    <!-- Mensaje principal mientras analiza -->
    <h2 class="title" v-if="!error">Analizando emociones...</h2>
    <p class="subtitle" v-if="!error">Esto puede tardar unos segundos.</p>
    <p v-if="store.emotions && !error" class="debug">
      Detectado: {{ emotionsSummary }}
    </p>

    <!-- Vista de error: no se detectó rostro -->
    <div v-if="error" class="error-box">
      <span class="material-symbols-outlined error-icon">face</span>
      <h2 class="title">¡Oops! No encontramos a nadie...</h2>
      <p class="subtitle">{{ errorMessage }}</p>
      <p class="fun-text">Tal vez tu selfie se volvió fantasma 👻. ¡Intenta de nuevo!</p>
      <button class="btn-upana" @click="restartFlow">Subir otra imagen</button>
    </div>

  </div>
</template>

<script>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/userStore";
import wsClient from "@/services/websocket";

export default {
  setup() {
    const store = useUserStore();
    const router = useRouter();

    const error = ref(false);
    const errorMessage = ref("");

    const emotionsSummary = computed(() =>
      Array.isArray(store.emotions)
        ? store.emotions.map(e => `${e.emotion} (${e.confidence}%)`).join(", ")
        : ""
    );

    const onMessageHandler = (msg) => {
      if (msg.type === "EMOTION_ANALYSIS_COMPLETE") {
        const primary = msg.data.primaryEmotion;
        const activities = msg.data.activities?.actividades || [];
        console.log(msg)
        store.setEmotions({
          emotion: primary.type,
          confidence: primary.confidence.toFixed(2)
        });
        store.setEmotionAnalysis(msg.data)
        store.setActivities(activities);
        store.completeStep(4);

        router.push("/result");
      }

      if (msg.type === "EMOTION_ANALYSIS_FAILED" && msg.data.faceDetected === false) {
        error.value = true;
        errorMessage.value = msg.data.message || "No se detectó rostro en la imagen";
      }
    };

    const restartFlow = () => {
      store.completeStep(2); 
      store.emotions = null;
      store.activities = [];
      error.value = false;
      router.push("/upload");
    };

    onMounted(() => {
      if (!wsClient.isConnected()) wsClient.connect(store.token);
      wsClient.on("onMessage", onMessageHandler);
    });

    onBeforeUnmount(() => {
      wsClient.off("onMessage", onMessageHandler);
    });

    return { store, emotionsSummary, error, errorMessage, restartFlow };
  }
};
</script>

<style scoped>
.processing-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 80vh;
  padding: 20px;
  animation: fadeIn 0.6s ease;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #003A79;
  margin-top: 25px;
}

.subtitle {
  font-size: 16px;
  color: #555;
  margin-bottom: 10px;
}

.debug {
  margin-top: 18px;
  font-size: 14px;
  opacity: 0.7;
}

.loader-box {
  position: relative;
  width: 180px;
  height: 180px;
}

.spinner {
  position: absolute;
  inset: 0;
  border: 6px solid #dce6ff;
  border-top-color: #003A79;
  border-radius: 50%;
  animation: spin 1.3s linear infinite;
}

.scan-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: absolute;
  box-shadow: 0 0 20px #ffd00044;
  animation: pulse 1.8s infinite ease-out;
  background: radial-gradient(circle, rgba(255,208,0,0.25) 0%, rgba(255,208,0,0) 80%);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.error-icon {
  font-size: 64px;
  color: #ff4d4d;
}

.fun-text {
  font-style: italic;
  color: #ff4d4d;
  margin-bottom: 15px;
}

.btn-upana {
  background: #003A79;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.btn-upana:hover {
  background: #002B5C;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0% { transform: scale(0.6); opacity: 0.4; }
  70% { transform: scale(1.2); opacity: 0; }
  100% { opacity: 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 500px) {
  .title { font-size: 22px; }
  .loader-box { width: 140px; height: 140px; }
  .error-icon { font-size: 48px; }
}
</style>
