import { ExpoConfig } from 'expo/config'

/**
 * Configuración en TypeScript en lugar de app.json porque necesita leer el entorno: la URL del
 * backend cambia entre local, preproducción y producción, y queda incrustada en la compilación.
 */
const COBALT = '#0c4a97'

const config: ExpoConfig = {
  name: 'NX036',
  // `slug` es la identidad del proyecto dentro de la cuenta de Expo y forma parte de la dirección
  // del panel (expo.dev/accounts/<cuenta>/projects/<slug>). Si no coincide con el proyecto al que
  // apunta `extra.eas.projectId`, EAS aborta antes de compilar. Véase docs/EAS.md.
  slug: 'nx036',
  // Cuenta u organización propietaria. Se lee del entorno para no dejar escrito aquí un
  // identificador sin confirmar: mientras no se defina, EAS lo deduce del `projectId`.
  owner: process.env.EXPO_OWNER,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // El esquema propio es lo que permitirá a la app recuperar el control tras el acceso social.
  scheme: 'nx036',
  // La nueva arquitectura de React Native viene activada por defecto en el SDK 57: ya no hay
  // propiedad que declarar.
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.nx036.app',
  },
  android: {
    package: 'com.nx036.app',
    adaptiveIcon: {
      backgroundColor: COBALT,
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: COBALT,
        imageWidth: 160,
      },
    ],
  ],
  extra: {
    eas: {
      // El identificador real lo entrega `eas init` o el panel de Expo. Se mantiene en el entorno
      // (`.env` en local, variable de entorno de EAS en la nube) para no versionarlo a ciegas.
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
}

export default config
