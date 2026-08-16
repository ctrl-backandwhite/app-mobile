# NX036 · App móvil

Aplicación para Android e iOS dirigida al **revendedor** de la plataforma NX036. Consume las mismas
APIs que el panel web y replica su lenguaje visual.

## Requisitos

- **Node 22** (hay `.nvmrc`). El Node del sistema puede ser anterior y no sirve para Expo 57.
- SDK de Android para compilar en local. Para iOS se usa EAS Build, que compila en la nube.

## Puesta en marcha

```bash
nvm use                 # toma la versión del .nvmrc
npm install
cp .env.example .env    # ajusta EXPO_PUBLIC_API_BASE_URL a tu backend
npm start
```

Con el emulador de Android, la máquina anfitriona se alcanza en `10.0.2.2`, no en `localhost`. Con
un teléfono físico, usa la IP de tu equipo en la red local.

| Variable | Para qué sirve |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Raíz del backend, sin `/api` final |
| `EXPO_PUBLIC_DEFAULT_CURRENCY` | Divisa de partida antes de conocer al usuario |
| `EXPO_PUBLIC_DEFAULT_LOCALE` | Idioma de partida |

## Comandos

```bash
npm start          # servidor de desarrollo
npm run android    # abre en el emulador o el dispositivo conectado
npm run ios        # requiere macOS; en Linux se usa EAS Build
npm test           # pruebas
npm run typecheck  # comprobación de tipos
npm run lint       # estilo y fronteras entre capas
```

## Arquitectura

Hexagonal por features. Las dependencias solo apuntan hacia dentro:

```
presentation  ──▶  domain  ◀──  data
```

```
app/                    rutas de expo-router: composición fina
src/core/               infraestructura transversal (http, storage, errors, result, di, captcha)
src/design-system/      tokens y componentes visuales
src/features/<f>/
  domain/               entidades, puertos y casos de uso — TypeScript puro
  data/                 DTOs con Zod, mappers y repositorios
  presentation/         pantallas, componentes y hooks
```

El dominio no conoce React, ni HTTP, ni el almacenamiento: se prueba sin montar nada. La regla de
dependencia no se vigila a mano, la verifica `eslint-plugin-boundaries`, así que una violación rompe
`npm run lint`.

Los detalles están en [el documento de diseño](../docs/superpowers/specs/2026-08-16-app-movil-react-native-design.md).

## Compilación

```bash
npx eas build --profile preview  --platform android   # APK interno
npx eas build --profile production --platform all     # paquetes de tienda
```

Los perfiles viven en `eas.json`. Cada uno fija su propia `EXPO_PUBLIC_API_BASE_URL`, que queda
incrustada en la compilación.

## Convenciones

Están recogidas en [`AGENTS.md`](AGENTS.md).
