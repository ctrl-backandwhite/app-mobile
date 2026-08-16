# Compilar la app NX036 con EAS

Cómo se compila esta aplicación en los servidores de Expo (EAS) a partir del repositorio de GitHub.

## Qué hay en el repositorio

| Fichero | Para qué sirve |
| --- | --- |
| `.eas/workflows/comprobaciones.yml` | Tipos, lint y pruebas con cobertura. No compila. Se dispara al empujar y en cada pull request sobre `main`, `develop` y `features`. |
| `.eas/workflows/preview-android.yml` | APK instalable de preproducción (perfil `preview`). Se dispara a mano o al poner la etiqueta `preview-android` en una pull request. |
| `.eas/workflows/produccion.yml` | Compilaciones de tienda para Android e iOS (perfil `production`). Se dispara a mano o al empujar una etiqueta de versión `v*`. |
| `eas.json` | Perfiles de compilación. Fija `EXPO_PUBLIC_API_BASE_URL` por entorno y la imagen de máquina que exige la integración con GitHub. |
| `app.config.ts` | Identidad de la app: `slug`, `owner` y `extra.eas.projectId`. |

Los tres flujos ejecutan primero el trabajo de comprobaciones y solo compilan si está en verde, así
que una regresión de tipos o una cobertura por debajo del 90 % no llega a gastar una compilación.

> **El fichero tiene que estar en la referencia de git que ejecutas.** Si el panel responde «no se
> encontraron archivos de flujo de trabajo en `.eas/workflows/`», es que la rama elegida todavía no
> tiene estos ficheros. Empuja la rama antes de ejecutar.


## Identidad del proyecto (resuelto)

| Campo | Valor | Dónde vive |
|---|---|---|
| Nombre visible | `nx036` | Panel de Expo |
| **Slug** | **`jfinol02`** | `app.config.ts` |
| Project ID | `13a8bd95-5314-4527-8d1b-724191e54afa` | `app.config.ts` |
| Cuenta | `nx036s-team` | `app.config.ts` |

El slug dice `jfinol02` y no `nx036` porque **el slug de un proyecto de Expo no se puede cambiar**:
renombrarlo en el panel cambia el nombre que se ve, no el identificador de la dirección. Ese
proyecto es además el que tiene conectado el repositorio de GitHub.

Si algún día se quiere el slug `nx036` hay que **crear un proyecto nuevo** (`eas init` con el slug
deseado) y **volver a conectar GitHub y las credenciales de firma**. Es una decisión de imagen, no
técnica: nada deja de funcionar por conservar `jfinol02`.

El `projectId` va escrito en `app.config.ts` y no en una variable de entorno porque EAS lo necesita
**antes** de cargar el entorno de la compilación; con la variable, aborta con «EAS project not
configured». No es un secreto.

## Pasos manuales, en orden

Estos pasos necesitan sesión en Expo o permisos en GitHub, así que hay que darlos a mano.

1. **Instalar la CLI y entrar.**

   ```bash
   export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
   npm install -g eas-cli
   eas login
   ```

2. **Decidir a qué proyecto de Expo pertenece esta app.** La dirección del panel tiene la forma
   `expo.dev/accounts/<cuenta>/projects/<slug>`. Si el `<slug>` de esa dirección no es `nx036`, hay
   dos caminos y hay que elegir uno antes de seguir:

   - Renombrar el proyecto en Expo (**Project settings** → nombre del proyecto) para que su slug
     pase a ser `nx036`, o
   - cambiar `slug` en `app.config.ts` para que coincida con el proyecto que ya existe.

   Si no coinciden, EAS aborta antes de compilar o manda la compilación a otro proyecto.

3. **Enlazar el proyecto y obtener el identificador.** Desde la raíz del repositorio:

   ```bash
   eas init
   ```

   El comando crea o enlaza el proyecto y devuelve el `projectId` (un UUID). Anótalo.

4. **Dar de alta el identificador y la cuenta.** `app.config.ts` los lee del entorno:

   - En local, en `.env` (no se versiona):

     ```
     EAS_PROJECT_ID=<el UUID del paso anterior>
     EXPO_OWNER=<la cuenta u organización de Expo>
     ```

   - En la nube, como variables de entorno de EAS en los tres entornos (`development`, `preview` y
     `production`), en **Project settings → Environment variables** o por CLI:

     ```bash
     # Repite el comando cambiando --environment por development, preview y production.
     eas env:set --name EAS_PROJECT_ID --value <UUID> --environment production --visibility plaintext
     eas env:set --name EXPO_OWNER --value <cuenta> --environment production --visibility plaintext
     ```

   Si prefieres no depender del entorno, escribe el UUID directamente en `extra.eas.projectId` de
   `app.config.ts`: es lo que hace `eas init` por defecto y no es un secreto.

5. **Enlazar tu usuario de GitHub con el de Expo.** En **Account settings → Overview → User settings
   → Connections**, comprueba que aparece tu cuenta de GitHub y acepta los permisos de la aplicación
   de GitHub de Expo.

6. **Instalar la aplicación de GitHub de Expo y enlazar el repositorio.** En **Project settings →
   GitHub**, instala la aplicación y conecta `ctrl-backandwhite/app-mobile`. Requiere ser Owner o
   Admin de la cuenta de Expo. El **Base directory** se deja vacío: la app está en la raíz del
   repositorio.

7. **Hacer una primera compilación desde tu equipo para cada plataforma.** Expo lo exige como
   requisito antes de permitir compilar desde GitHub, y además es donde se generan las credenciales
   de firma:

   ```bash
   eas build -p android --profile preview
   ```

8. **Configurar las credenciales de producción** cuando vayas a usar `produccion.yml`:

   ```bash
   eas credentials:configure-build -p android -e production
   eas credentials:configure-build -p ios -e production   # necesita cuenta de Apple Developer
   ```

9. **Crear la etiqueta `preview-android` en GitHub** (**Issues → Labels → New label**). Es la que
   dispara `preview-android.yml` al ponerla en una pull request.

10. **Empujar los ficheros a la rama** desde la que vayas a ejecutar. Sin esto, el panel sigue sin
    ver los flujos.

## Lanzar una compilación

### Desde el panel

- **Flujos de trabajo:** `expo.dev/accounts/<cuenta>/projects/<slug>/workflows` → **Ejecutar flujo
  de trabajo** → elige el fichero y la referencia de git. Los flujos con `workflow_dispatch`
  preguntan por sus parámetros (la nota del APK de previsualización, las plataformas de producción).
- **Compilación suelta sin flujo:** en la lista de compilaciones, **Build from GitHub** → referencia
  de git, plataforma y perfil de `eas.json`.

### Desde la terminal

```bash
eas workflow:run .eas/workflows/comprobaciones.yml
eas workflow:run .eas/workflows/preview-android.yml -F motivo="Prueba de acceso con Google"
eas workflow:run .eas/workflows/produccion.yml -F plataformas=android
```

También se puede compilar sin flujo, directamente:

```bash
eas build -p android --profile preview
eas build -p all --profile production
```

### Desde GitHub

- Poner la etiqueta **`preview-android`** en una pull request ejecuta `preview-android.yml`.
- Empujar una etiqueta de versión ejecuta `produccion.yml`:

  ```bash
  git tag v0.2.0 && git push origin v0.2.0
  ```

- Al margen de los flujos, la aplicación de GitHub de Expo entiende etiquetas con la forma
  `eas-build-[plataforma]:[perfil]`, por ejemplo `eas-build-android:preview`. Compila, pero se salta
  las comprobaciones: es un atajo, no el camino normal.

- Para saltarte una ejecución disparada por empujón o pull request, incluye `[eas skip]` en el
  mensaje del commit.

## Variables y secretos

| Nombre | Dónde | Para qué |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `eas.json`, en el `env` de cada perfil | URL del backend. Queda incrustada en la compilación. Ya está puesta y no hay que tocarla. |
| `EAS_PROJECT_ID` | `.env` en local; variable de entorno de EAS en los tres entornos | Identificador del proyecto de Expo. |
| `EXPO_OWNER` | igual que el anterior | Cuenta u organización propietaria. |

Las variables de EAS se dan de alta en **Project settings → Environment variables** (o con
`eas env:set`) y tienen tres visibilidades: texto plano, sensible y secreta. Nada que acabe dentro
del binario es realmente secreto: lo que viaja en la app lo puede leer cualquiera que la instale.
Las claves de firma no son variables de entorno; las gestiona EAS aparte, con los comandos de
`eas credentials`.

## Limitaciones conocidas

- **Instalar en un iPhone físico exige una cuenta de Apple Developer de pago** (99 USD al año). Sin
  ella no se puede firmar el perfil ad hoc que necesita la distribución interna, ni subir a
  TestFlight ni a la App Store. Por eso el flujo de previsualización es solo de Android. En Android
  no hay ninguna cuenta de pago de por medio: el APK se instala desde el enlace que devuelve EAS
  activando «orígenes desconocidos». Publicar en Google Play sí requiere la cuenta de desarrollador
  (25 USD, pago único), pero solo para publicar, no para probar.
- **El perfil `development` de `eas.json` todavía no es utilizable.** Lleva
  `developmentClient: true`, que exige el paquete `expo-dev-client`, y el proyecto aún no lo tiene
  instalado. Por eso ningún flujo lo usa. Para habilitarlo: `npx expo install expo-dev-client`.
- **Los flujos no envían a las tiendas.** `produccion.yml` compila y ahí se detiene. Automatizar el
  envío requiere dar de alta antes la cuenta de servicio de Google Play y la clave de App Store
  Connect en el bloque `submit` de `eas.json`.
