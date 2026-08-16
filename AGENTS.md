# App móvil NX036 — guía de trabajo

> **Expo ha cambiado.** Consulta la documentación versionada en
> https://docs.expo.dev/versions/v57.0.0/ antes de usar cualquier API de Expo. El conocimiento
> previo sobre versiones anteriores caduca.

## Arranque

```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"   # el Node del sistema es 18 y no sirve
npm install
cp .env.example .env
npm start
```

## Qué es esto

Aplicación para Android e iOS dirigida al **revendedor** de la plataforma NX036. Consume las mismas
APIs que el panel web y replica su lenguaje visual. **No** sirve el back-office: si entra un usuario
ADMIN u OPERATOR, la app le remite al escritorio.

## Arquitectura

Hexagonal por features. Las dependencias solo apuntan hacia dentro:

```
presentation  ──▶  domain  ◀──  data
```

```
app/                    rutas de expo-router, solo composición
src/core/               infraestructura transversal (http, storage, errors, result, di, captcha)
src/design-system/      tokens y componentes visuales
src/features/<f>/
  domain/               entidades, puertos y casos de uso — TypeScript PURO
  data/                 DTOs Zod, mappers y repositorios
  presentation/         pantallas, componentes y hooks
```

- `domain/` no importa React, React Native ni axios. Solo `Result` y `AppError` de `core`.
- `data/` valida **toda** respuesta con Zod: un contrato roto falla como `CONTRACT` en la frontera.
- `presentation/` consume **casos de uso**, nunca repositorios ni el cliente HTTP.

La regla la verifica `eslint-plugin-boundaries`: si el lint pasa, la arquitectura se sostiene.

## Dependencias

- **Nunca `--legacy-peer-deps`.** Un `ERESOLVE` se resuelve alineando versiones o con `overrides`.
- `npx expo install <paquete>` para todo lo que toque el runtime nativo, no `npm i`.
- `npx expo install --check` dice qué versión toca. «Actual» es lo que el SDK soporta hoy.
- Nada deprecado.

## Convenciones

- TypeScript estricto: sin `any`, sin `var`, tipos explícitos en firmas públicas.
- Sin punto y coma final.
- Comentarios en español y solo para explicar el **porqué**, nunca para narrar el código.
- Estilos con `className` de NativeWind, no `StyleSheet`.
- `accessibilityLabel` en todo campo, `accessibilityRole` en pulsables y avisos.
- Los mensajes de error los traduce el backend vía `X-Lang`; los textos locales son de reserva.

## Acceso con Google

La aplicación abre `${API}/oauth2/authorization/google?client=mobile` en la vista de navegador del
sistema y recibe la vuelta en el enlace profundo `nx036://auth/callback`.

`client=mobile` es un **identificador**, nunca una URL: el backend lo traduce a uno de sus destinos
configurados. No cambies esto por enviar la dirección de retorno — convertiría el backend en un
redirector abierto, y con él cualquier cuenta en un objetivo.

Requiere `MOBILE_OAUTH_CALLBACK_URL` en el backend, con el mismo valor que el `scheme` de
`app.config.ts`.

## Verificación

```bash
npm run typecheck && npm run lint && npm test
```

Cobertura mínima del 90 % en las cuatro métricas, con el umbral configurado para que su incumplimiento rompa la ejecución.
No des nada por terminado sin haber visto esa salida en verde.

## Git

Rama de trabajo `features`. El merge a `develop` y a `main` lo decide la persona responsable.
No hagas push salvo petición explícita.
