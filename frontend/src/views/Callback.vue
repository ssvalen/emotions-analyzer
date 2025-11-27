<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/userStore";

const router = useRouter();
const store = useUserStore();

//Carga de sesion de cognito si existe
onMounted(async () => {
  try {
    await store.loadUser();
    if (store.user) {
      router.push("/consent"); //Dirigir a inicio de flujo
    } else {
      router.push("/"); // Si lo esta logeado retornar a login
    }
  } catch (err) {
    console.error("Error cargando usuario:", err);
    router.push("/");
  }
});
</script>
