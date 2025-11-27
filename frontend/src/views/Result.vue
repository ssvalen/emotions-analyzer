<template>
  <div class="resultado-container" v-if="emotion">

    <h2 class="titulo">Resultados de tu Análisis</h2>

    <div class="card-principal">

      <!-- izquierda -->
      <div class="bloque-izq">
        <h3 class="label-emocion">Emoción Principal Reconocida</h3>

        <div class="circulo-container" :style="`--valor:${emotion.confidence}`">
          <div class="circulo"></div>

          <div class="circulo-texto">
            <div class="porcentaje">{{ emotion.confidence }}%</div>
            <div class="estado">{{ emotionSpanish || formattedEmotion }}</div>
          </div>
        </div>

        <!-- Emociones secundarias -->
        <div v-if="secondaryEmotions.length > 0" class="emociones-secundarias">
          <h4>Otras emociones detectadas:</h4>
          <div class="emotion-tag" v-for="(em, idx) in secondaryEmotions" :key="idx">
            <span class="emotion-name">{{ em.nameSpanish }}</span>
            <span class="emotion-conf">{{ em.confidence }}%</span>
          </div>
        </div>
      </div>

      <!-- derecha -->
      <div class="bloque-der">
        <p class="descripcion">
          {{ descriptionText }}
        </p>

        <!-- Análisis facial adicional -->
        <div v-if="faceAnalysis" class="face-analysis">
          <h4>Detalles del análisis:</h4>
          <div class="analysis-grid">
            <div class="analysis-item">
              <span class="material-symbols-outlined">cake</span>
              <span>{{ ageRangeText }}</span>
            </div>
            <div class="analysis-item">
              <span class="material-symbols-outlined">person</span>
              <span>{{ genderText }}</span>
            </div>
            <div class="analysis-item" v-if="faceAnalysis.smile">
              <span class="material-symbols-outlined">sentiment_satisfied</span>
              <span>{{ faceAnalysis.smile.value ? 'Sonriendo' : 'Serio' }}</span>
            </div>
            <div class="analysis-item" v-if="faceAnalysis.eyesOpen">
              <span class="material-symbols-outlined">visibility</span>
              <span>{{ faceAnalysis.eyesOpen.value ? 'Ojos abiertos' : 'Ojos cerrados' }}</span>
            </div>
          </div>
        </div>

        <div class="alerta">
          <strong>Importante:</strong> Este resultado es una estimación y no constituye un diagnóstico médico.
        </div>

        <button class="btn-profesional" @click="toggleProfesional">
          Contactar a un Profesional
        </button>

        <div v-if="showInfo" class="info-profesional">
          <h3>Agenda tu cita</h3>
          <p>
            <strong>Horario de atención:</strong><br>
            Lunes a Viernes 8:00 AM → 5:00 PM<br>
            Sábados 7:00 AM → 12:00 PM
          </p>
          <p>
            <strong>Ubicación:</strong><br>
            Nivel 3 Spazio, Zona 15.
          </p>
          <p>
            <strong>Teléfono:</strong> 4578-1247<br>
            <strong>Correo:</strong> bienestar@upana.edu.gt
          </p>
        </div>

      </div>
    </div>

    <div class="separador"></div>

    <section class="que-hacer-ahora">
      <h2>¿Qué hacer ahora?</h2>

      <button class="btn-recomendaciones" @click="goToActivities">
        Ver recomendaciones personalizadas
      </button>

      <p class="texto-ayuda">
        Explora {{ activitiesCount }} consejos personalizados basados en tu estado emocional actual.
      </p>
    </section>

  </div>

  <!-- Si no hay datos -->
  <div v-else class="container center">
    <h2 class="title">Procesando...</h2>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/userStore";

export default {
  setup() {
    const router = useRouter();
    const store = useUserStore();
    const showInfo = ref(false);

    const emotion = computed(() => store.emotions);
    const faceAnalysis = computed(() => store.faceAnalysis);
    const emotionSpanish = computed(() => store.emotionSpanish);
    const allEmotions = computed(() => store.allEmotions || []);
    const activitiesCount = computed(() => store.activities?.length || 0);

    const formattedEmotion = computed(() =>
      emotion.value?.emotion
        ? emotion.value.emotion.charAt(0).toUpperCase() + emotion.value.emotion.slice(1).toLowerCase()
        : ""
    );

    const secondaryEmotions = computed(() => {
      if (!allEmotions.value || allEmotions.value.length <= 1) return [];
      
      return allEmotions.value.slice(1).map(em => ({
        nameSpanish: em.tipoEspanol || em.tipo,
        confidence: em.confianza
      }));
    });

    const ageRangeText = computed(() => {
      if (!faceAnalysis.value?.ageRange) return '';
      const { Low, High } = faceAnalysis.value.ageRange;
      return `${Low}-${High} años`;
    });

    const genderText = computed(() => {
      if (!faceAnalysis.value?.gender) return '';
      return faceAnalysis.value.gender.value === 'Male' ? 'Masculino' : 'Femenino';
    });

    const descriptionText = computed(() => {
      const emotionName = emotionSpanish.value || formattedEmotion.value.toLowerCase();
      return `El sistema detectó un nivel significativo de ${emotionName}${secondaryEmotions.value.length > 0 ? ', junto con otras emociones' : ''}. Recuerda que siempre hay herramientas y apoyo disponibles.`;
    });

    const toggleProfesional = () => {
      showInfo.value = !showInfo.value;
    };

    const goToActivities = () => {
      router.push("/activities");
    };

    return {
      emotion,
      emotionSpanish,
      faceAnalysis,
      formattedEmotion,
      secondaryEmotions,
      ageRangeText,
      genderText,
      descriptionText,
      activitiesCount,
      showInfo,
      toggleProfesional,
      goToActivities
    };
  }
};
</script>

<style scoped>
.emociones-secundarias {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.emociones-secundarias h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.emotion-tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.85rem;
}

.emotion-name {
  font-weight: 500;
}

.emotion-conf {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.face-analysis {
  margin: 20px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.face-analysis h4 {
  font-size: 1rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 0.9rem;
}

.analysis-item .material-symbols-outlined {
  font-size: 20px;
  color: var(--color-primary, #4a90e2);
}
</style>
<style src="@/assets/css/resultados.css"></style>
