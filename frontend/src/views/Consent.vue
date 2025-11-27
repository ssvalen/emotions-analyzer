<template>
  <div class="container max-820">
    <h1 class="center">Tu privacidad es importante para nosotros</h1>
    <p class="descripcion-consent" style="text-align: center;">
      Antes de comenzar, necesitamos tu consentimiento para recopilar y analizar tu información de manera segura.
    </p>

    <div class="grid-2">
      <div class="card">
        <span class="material-symbols-outlined icon-consent">photo_camera</span>
        <h3>Recopilación de Datos</h3>
        <p>Tomamos una fotografía para análisis de bienestar emocional.</p>
      </div>
      <div class="card">
        <span class="material-symbols-outlined icon-consent">analytics</span>
        <h3>Uso de la Información</h3>
        <p>La fotografía se usa solo para análisis de expresiones emocionales.</p>
      </div>
      <div class="card">
        <span class="material-symbols-outlined icon-consent">shield</span>
        <h3>Seguridad</h3>
        <p>Los datos no se almacenan permanentemente.</p>
      </div>
      <div class="card">
        <span class="material-symbols-outlined icon-consent">manage_accounts</span>
        <h3>Derechos</h3>
        <p>Puedes negar o retirar tu consentimiento en cualquier momento.</p>
      </div>
    </div>

    <div class="card check-card">
      <input type="checkbox" id="acepto" v-model="acepto" />
      <label for="acepto">He leído y acepto los términos de privacidad.</label>
    </div>

    <div class="btn-center">
      <button class="btn-upana" @click="continuar">Aceptar y Continuar</button>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

export default {
  setup() {
    const acepto = ref(false);
    const store = useUserStore();
    const router = useRouter();

    const continuar = () => {
      if (!acepto.value) return alert("Debes aceptar los términos para continuar.");
      store.completeStep(2);
      router.push('/upload');
    };

    return { acepto, continuar };
  }
};
</script>

<style src="@/assets/css/upana.css"></style>
