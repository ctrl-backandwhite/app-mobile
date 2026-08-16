import { ExpoConfig } from 'expo/config'

/**
 * Configuración en TypeScript en lugar de app.json porque necesita leer el entorno: la URL del
 * backend cambia entre local, preproducción y producción, y queda incrustada en la compilación.
 */
const COBALT = '#0c4a97'

const config: ExpoConfig = {
  name: 'NX036',
  /*
   * `slug` es la identidad del proyecto dentro de la cuenta de Expo y forma parte de la dirección
   * del panel (expo.dev/accounts/<cuenta>/projects/<slug>). Tiene que coincidir con el proyecto al
   * que apunta `extra.eas.projectId` o EAS aborta antes de compilar.
   *
   * Dice `jfinol02` y no `nx036` porque **el slug de un proyecto de Expo no se puede cambiar**:
   * renombrarlo en el panel cambia el nombre visible (que sí es «nx036»), no el identificador. Este
   * proyecto es además el que tiene conectado el repositorio de GitHub, así que cambiarlo obligaría
   * a crear otro y a rehacer esa conexión. Véase docs/EAS.md.
   */
  slug: 'jfinol02',
  owner: 'nx036s-team',
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
      /*
       * Identificador del proyecto en Expo. Va escrito y no en una variable de entorno porque EAS
       * lo necesita ANTES de cargar el entorno de la compilación: sin él, aborta con «EAS project
       * not configured». No es un secreto, es un identificador público como el nombre del proyecto.
       */
      projectId: '13a8bd95-5314-4527-8d1b-724191e54afa',
    },
  },
}

export default config
