import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: import.meta.env.VITE_AWS_COGNITO_USERPOOL_ID,
  ClientId: import.meta.env.VITE_AWS_CONGITO_CLIENTE_ID,
};

const userPool = new CognitoUserPool(poolData);

export const authService = {
  /**
   * Registrar nuevo usuario
   */
  register({ email, password, username, nombre, apellidos }) {
    return new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name", Value: nombre }),
        new CognitoUserAttribute({ Name: "family_name", Value: apellidos }),
        new CognitoUserAttribute({ Name: "preferred_username", Value: username }),
        new CognitoUserAttribute({ Name: "nickname", Value: username })
      ];

      userPool.signUp(username, password, attributes, null, (err, result) => {
        if (err) {
          console.error("Error en registro:", err);
          return reject(err);
        }
        console.log("Usuario registrado:", result.user);
        resolve(result.user);
      });
    });
  },

  /**
   * Iniciar sesión
   */
  login(emailOrUsername, password) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: emailOrUsername,
        Pool: userPool
      });

      const authDetails = new AuthenticationDetails({
        Username: emailOrUsername,
        Password: password
      });

      user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          // Obtener atributos del usuario
          user.getUserAttributes((err, attributes) => {
            const userInfo = {
              id_token: result.getIdToken().getJwtToken(),
              access_token: result.getAccessToken().getJwtToken(),
              refresh_token: result.getRefreshToken().getToken(),
              username: user.getUsername()
            };

            // Añadir atributos si están disponibles
            if (!err && attributes) {
              attributes.forEach(attr => {
                if (attr.Name === 'email') userInfo.email = attr.Value;
                if (attr.Name === 'name') userInfo.name = attr.Value;
                if (attr.Name === 'preferred_username') userInfo.preferred_username = attr.Value;
              });
            }

            resolve(userInfo);
          });
        },
        onFailure: (err) => {
          console.error("Error en login:", err);
          reject(err);
        },
        newPasswordRequired: (userAttributes) => {
          
          reject({
            code: "NewPasswordRequired",
            message: "Debes cambiar tu contraseña",
            userAttributes
          });
        }
      });
    });
  },

  /**
   * Obtener usuario actual
   */
  getUser() {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) return null;

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err, session) => {
        if (err) {
          console.error("Error obteniendo sesión:", err);
          return reject(err);
        }

        if (!session.isValid()) {
          return reject(new Error("Sesión inválida"));
        }

        resolve({
          id_token: session.getIdToken().getJwtToken(),
          access_token: session.getAccessToken().getJwtToken(),
          username: cognitoUser.getUsername()
        });
      });
    });
  },

  /**
   * Cerrar sesión
   */
  logout() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      console.log("Sesión cerrada");
    }
  },

  /**
   * Solicitar código de recuperación de contraseña
   * Puede usar email o username
   */
  forgotPassword(emailOrUsername) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: emailOrUsername,
        Pool: userPool
      });

      user.forgotPassword({
        onSuccess: (data) => {
          console.log("Código enviado:", data);
          resolve(data);
        },
        onFailure: (err) => {
          console.error("Error al solicitar código:", err);
          reject(err);
        },
        inputVerificationCode: (data) => {
          console.log("Verificación requerida:", data);
          resolve(data);
        }
      });
    });
  },

  /**
   * Confirmar nueva contraseña con código
   * Puede usar email o username
   */
  confirmPassword(emailOrUsername, verificationCode, newPassword) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: emailOrUsername,
        Pool: userPool
      });

      user.confirmPassword(verificationCode, newPassword, {
        onSuccess: () => {
          console.log("Contraseña actualizada exitosamente");
          resolve();
        },
        onFailure: (err) => {
          console.error("Error al confirmar contraseña:", err);
          reject(err);
        }
      });
    });
  },

  /**
   * Verificar código de confirmación de email después del registro
   */
  confirmRegistration(username, code) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool: userPool
      });

      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error("Error al confirmar registro:", err);
          return reject(err);
        }
        console.log("Registro confirmado:", result);
        resolve(result);
      });
    });
  },

  /**
   * Reenviar código de confirmación
   */
  resendConfirmationCode(username) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool: userPool
      });

      user.resendConfirmationCode((err, result) => {
        if (err) {
          console.error("Error al reenviar código:", err);
          return reject(err);
        }
        console.log("Código reenviado:", result);
        resolve(result);
      });
    });
  },

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  changePassword(oldPassword, newPassword) {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return reject(new Error("No hay usuario autenticado"));
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          return reject(err);
        }

        cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
          if (err) {
            console.error("Error al cambiar contraseña:", err);
            return reject(err);
          }
          console.log("Contraseña cambiada:", result);
          resolve(result);
        });
      });
    });
  }
};