import { ExpoConfig } from 'expo/config'

/**
 * Configuración en TypeScript en lugar de app.json porque necesita leer el entorno: la URL del
 * backend cambia entre local, preproducción y producción, y queda incrustada en la compilación.
 */
const COBALT = '#0c4a97'

const config: ExpoConfig = {
  name: 'NX036',
  slug: 'nx036',
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
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
}

export default config
