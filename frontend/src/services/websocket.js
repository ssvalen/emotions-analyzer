
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    this.listeners = {
      onOpen: [],
      onMessage: [],
      onError: [],
      onClose: []
    };
  }

  /**
   * Conectar WebSocket con token de autenticación de cognito
   */
  connect(token) {
    if (!token) {
      console.error("Token requerido para conectar WebSocket");
      return;
    }

    this.token = token;
    this.shouldReconnect = true;

    try {

      this.ws = new WebSocket(`${import.meta.env.VITE_AWS_WEBSOCKET_URL}?Authorization=${token}`);

      this.ws.onopen = (event) => {
        console.log("WebSocket conectado");
        this.reconnectAttempts = 0;
        this.triggerListeners('onOpen', event);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.triggerListeners('onMessage', data);
        } catch (error) {
          console.error("Error parseando mensaje:", error);
          console.log("Mensaje raw:", event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.triggerListeners('onError', error);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket cerrado:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });

        this.triggerListeners('onClose', event);

        // Reconexión automática
        if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          console.log(
            `Intentando reconectar (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
          );
          setTimeout(() => this.connect(this.token), RECONNECT_DELAY);
        } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error("Máximo de intentos de reconexión alcanzado");
        }
      };

    } catch (error) {
      console.error("Error creando WebSocket:", error);
    }
  }


  /**
   * Cerrar conexión WebSocket
   */
  disconnect(shouldReconnect = false) {
    this.shouldReconnect = shouldReconnect;
    
    if (this.ws) {
      console.log("Cerrando WebSocket...");
      this.ws.close(1000, "Cliente cerró conexión");
      this.ws = null;
    }
  }

  /**
   * Registrar listener para eventos
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remover listener
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Disparar todos los listeners de un evento
   */
  triggerListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Obtener estado de la conexión
   */
  getReadyState() {
    if (!this.ws) return "NO_INITIALIZED";
    
    const states = {
      [WebSocket.CONNECTING]: "CONNECTING",
      [WebSocket.OPEN]: "OPEN",
      [WebSocket.CLOSING]: "CLOSING",
      [WebSocket.CLOSED]: "CLOSED"
    };
    
    return states[this.ws.readyState] || "UNKNOWN";
  }

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

const wsClient = new WebSocketClient();

export default wsClient;

export const connectWebSocket = (token) => wsClient.connect(token);
export const sendMessage = (msg) => wsClient.send(msg);
export const disconnectWebSocket = () => wsClient.disconnect();
export const isWebSocketConnected = () => wsClient.isConnected();