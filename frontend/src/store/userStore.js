import { defineStore } from 'pinia';
import { authService } from '@/services/auth.js';
import wsClient from "@/services/websocket.js";

export const useUserStore = defineStore('user', {
  state: () => ({
    token: "",
    user: null,
    fotoBase64: "",
    
    // Datos de emociones (mejorados)
    emotions: null,
    emotionSpanish: null,
    allEmotions: [],             
    faceAnalysis: null,          
    activities: [],              
    stepCompleted: 0,
  }),

  getters: {
    /**
     * Obtiene la emoción primaria en español
     */
    primaryEmotionSpanish: (state) => {
      return state.emotionSpanish || 
             state.emotions?.emotion || 
             'desconocida';
    },

    /**
     * Verifica si hay emociones secundarias
     */
    hasSecondaryEmotions: (state) => {
      return state.allEmotions && state.allEmotions.length > 1;
    },

    /**
     * Obtiene solo las emociones secundarias (sin la primaria)
     */
    secondaryEmotions: (state) => {
      if (!state.allEmotions || state.allEmotions.length <= 1) {
        return [];
      }
      return state.allEmotions.slice(1);
    }
  },

  actions: {
    setToken(token) {
      this.token = token;
    },

    setUser(user) {
      this.user = user;
    },

    setFotoBase64(foto) {
      this.fotoBase64 = foto;
    },

    /**
     * Método legacy - mantiene compatibilidad
     */
    setEmotions(emotionObject) {
      this.emotions = emotionObject;
    },

    setActivities(activities) {
      this.activities = activities || [];
    },

    completeStep(step) {
      this.stepCompleted = step;
    },

    /**
     * Procesa la respuesta completa del análisis de emociones
     * Compatible con el nuevo formato de la Lambda
     */
    setEmotionAnalysis(data) {
      console.log('📊 Procesando análisis de emociones:', data);

      // Emoción principal (mantiene compatibilidad con código existente)
      if (data.primaryEmotion) {
        this.emotions = {
          emotion: data.primaryEmotion.type,
          confidence: data.primaryEmotion.confidence
        };
      } else if (data.emotions && data.emotions.length > 0) {
        this.emotions = {
          emotion: data.emotions[0].type,
          confidence: data.emotions[0].confidence
        };
      }

      // Nombre en español de la emoción principal
      if (data.activities?.emocionPrimaria) {
        this.emotionSpanish = data.activities.emocionPrimaria.tipoEspanol;
      }

      // Todas las emociones detectadas
      if (data.activities?.emocionesDetectadas) {
        this.allEmotions = data.activities.emocionesDetectadas;
      } else if (data.emotions) {
        // Fallback: usar las emociones del Rekognition
        this.allEmotions = data.emotions
          .filter(e => e.confidence > 5)
          .map(e => ({
            tipo: e.type,
            tipoEspanol: e.type, // Si no hay español, usar inglés
            confianza: e.confidence
          }));
      }

      // Análisis facial completo
      if (data.faceAnalysis) {
        this.faceAnalysis = data.faceAnalysis;
      }

      // Actividades recomendadas
      if (data.activities?.actividades) {
        this.activities = data.activities.actividades;
      } else if (Array.isArray(data.activities)) {
        // Compatibilidad con formato antiguo
        this.activities = data.activities;
      }

      console.log('✅ Datos procesados:', {
        emociónPrimaria: this.emotionSpanish || this.emotions?.emotion,
        emociones: this.allEmotions.length,
        actividades: this.activities.length,
        análisisFacial: this.faceAnalysis ? 'Sí' : 'No'
      });
    },

    /**
     * Limpia todos los datos de análisis de emociones
     * Útil para hacer un nuevo análisis
     */
    clearEmotionData() {
      this.emotions = null;
      this.emotionSpanish = null;
      this.allEmotions = [];
      this.faceAnalysis = null;
      this.activities = [];
      this.fotoBase64 = "";
      
      console.log('🧹 Datos de emoción limpiados');
    },

    async loadUser() {
      // Recuperar del storage primero
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser);
        this.token = storedToken;
        if (!wsClient.isConnected()) wsClient.connect(this.token);
        return this.user;
      }

      // Si no hay storage, obtener de cognito
      const session = await authService.getUser();
      if (session) {
        this.user = session.profile;
        this.token = session.id_token;

        localStorage.setItem("user", JSON.stringify(this.user));
        localStorage.setItem("token", this.token);

        if (!wsClient.isConnected()) wsClient.connect(this.token);
      }
    },

    clearUser() {
      this.user = null;
      this.token = "";
      this.fotoBase64 = "";
      this.emotions = null;
      this.emotionSpanish = null;
      this.allEmotions = [];
      this.faceAnalysis = null;
      this.activities = [];
      this.stepCompleted = 0;
      wsClient.disconnect();
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }

  }
});