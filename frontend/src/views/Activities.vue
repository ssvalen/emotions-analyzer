<template>
  <div class="container max-900">

    <h1 class="center title">Recomendaciones para tu bienestar</h1>
    <p class="center subt">
      Actividades personalizadas según tu estado emocional: <strong>{{ primaryEmotionSpanish }}</strong>
    </p>

    <!-- Filtros por tipo de emoción -->
    <div v-if="emotionTypes.length > 1" class="emotion-filters">
      <button 
        class="filter-btn" 
        :class="{ active: selectedFilter === 'todas' }"
        @click="selectedFilter = 'todas'"
      >
        Todas ({{ activities.length }})
      </button>
      <button 
        v-for="emotion in emotionTypes" 
        :key="emotion"
        class="filter-btn" 
        :class="{ active: selectedFilter === emotion }"
        @click="selectedFilter = emotion"
      >
        {{ emotion }} ({{ getCountByEmotion(emotion) }})
      </button>
    </div>

    <div class="grid-3 gap-24">

      <div 
        class="card activity-card" 
        v-for="(a, i) in filteredActivities" 
        :key="i"
        :data-emotion="a.emocion"
      >
        <div class="card-header">
          <span class="material-symbols-outlined icon-consent">{{ a.icono || 'spa' }}</span>
          <span class="emotion-badge">{{ a.emocion }}</span>
        </div>
        <h3>{{ a.titulo }}</h3>
        <p>{{ a.texto }}</p>
        <div class="card-footer">
          <span class="confidence-badge">{{ a.confianza }}% confianza</span>
        </div>
      </div>

    </div>

    <div v-if="filteredActivities.length === 0" class="no-results">
      <span class="material-symbols-outlined">search_off</span>
      <p>No hay actividades para esta emoción</p>
    </div>

    <div class="btn-center" style="margin-top: 40px; display: flex; gap: 16px; justify-content: center;">
      <button class="btn-upana-light" @click="newTest">
        <span class="material-symbols-outlined">refresh</span>
        Hacer otro análisis
      </button>
      <button class="btn-upana" @click="goHome">
        <span class="material-symbols-outlined">home</span>
        Volver al inicio
      </button>
    </div>

  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/userStore";

export default {
  setup() {
    const router = useRouter();
    const store = useUserStore();
    const selectedFilter = ref('todas');

    const activities = computed(() => store.activities || []);
    const primaryEmotionSpanish = computed(() => store.emotionSpanish || 'tu estado');

    // Obtener tipos únicos de emociones
    const emotionTypes = computed(() => {
      const types = new Set();
      activities.value.forEach(a => {
        if (a.emocion) types.add(a.emocion);
      });
      return Array.from(types);
    });

    // Filtrar actividades según selección
    const filteredActivities = computed(() => {
      if (selectedFilter.value === 'todas') {
        return activities.value;
      }
      return activities.value.filter(a => a.emocion === selectedFilter.value);
    });

    // Contar actividades por emoción
    const getCountByEmotion = (emotion) => {
      return activities.value.filter(a => a.emocion === emotion).length;
    };

    onMounted(() => {
      store.completeStep(5);
    });

    const newTest = () => {
      store.completeStep(2);
      store.emotions = null;
      store.emotionSpanish = null;
      store.activities = [];
      store.faceAnalysis = null;
      store.allEmotions = [];
      router.push("/upload");
    };

    const goHome = () => {
      router.push("/");
    };

    return { 
      activities, 
      filteredActivities,
      emotionTypes,
      selectedFilter,
      primaryEmotionSpanish,
      getCountByEmotion,
      newTest, 
      goHome 
    };
  }
};
</script>

<style scoped>
.activity-card {
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.emotion-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  border-radius: 12px;
  font-weight: 600;
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.confidence-badge {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

.emotion-filters {
  display: flex;
  gap: 8px;
  margin: 24px 0;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #4a90e2;
  color: #4a90e2;
}

.filter-btn.active {
  background: #4a90e2;
  border-color: #4a90e2;
  color: white;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: rgba(0, 0, 0, 0.4);
}

.no-results .material-symbols-outlined {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.btn-upana,
.btn-upana-light {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-upana .material-symbols-outlined,
.btn-upana-light .material-symbols-outlined {
  font-size: 20px;
}
</style>