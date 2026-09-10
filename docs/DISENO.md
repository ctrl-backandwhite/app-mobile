# El diseño de NX036

## El concepto

**NX036 no es una tienda: es el mostrador de tu mayorista.**

Quien abre esta aplicación no compra por antojo, compra para revender. Cada pantalla responde a una
sola pregunta: *¿esto me da dinero?* De ahí salen las decisiones que siguen, y cualquier propuesta
nueva se mide contra ella.

Consecuencias prácticas:

- La portada no dice «Descubre», dice **«Qué vender hoy»**, y cada fila declara en qué se apoya
  —demanda al alza, ventas comprobadas— en lugar de llevar un rótulo decorativo.
- La ficha enseña la **prueba de venta** (valoración y ventas del mes) junto al precio, porque es lo
  que decide el pedido.
- El precio por cantidad no es una tabla de consulta: es la palanca del negocio, y se pinta como tal.

## El hilo de latón

El latón (`accent`, `#c0862d`) es la firma visual y tiene UNA sola regla:

> **El latón solo aparece donde hay dinero en juego.** Rebaja, ahorro, tramo de precio que baja,
> margen, saldo. Nunca decora.

Dónde está hoy: el distintivo de rebaja sobre la foto, el tramo de precio que aplica a la cantidad
elegida, el antetítulo de la portada, las estrellas de valoración. Dónde NO puede estar: bordes,
separadores, iconos de navegación, estados de la interfaz.

El cobalto (`primary`) es la acción y la confianza. El marino (`secondary`) es el fondo de marca.

## Tipografía

**Roboto Light es la voz.** El peso fino llega hasta los titulares grandes —a 32 y 22 píxeles un
trazo fino se lee como catálogo, no como cartel—. El peso medio entra solo donde el fino se rompe:
rótulos de 13 píxeles o menos, versales y cifras de precio.

Ninguna pantalla escribe `text-[15px] leading-[21px]`. Se elige el **papel** del texto:

| Papel | Cuerpo | Peso | Para qué |
|---|---|---|---|
| `display` | 32 | Light | El titular de la pantalla |
| `title` | 22 | Light | Cabecera de sección o bloque |
| `heading` | 17 | Medium | Rótulo de grupo, precio grande |
| `price` | 17 | Medium | Cifras de dinero |
| `body` | 15 | Light | Texto corriente (por omisión) |
| `label` | 13 | Medium | Rótulos, filas de lista |
| `caption` | 11 | Light | Texto auxiliar |
| `eyebrow` | 11 | Medium, versales | Antetítulo: por qué está aquí este bloque |

Y el **tono**, que es la intención del color: `default`, `muted`, `primary`, `accent`, `inverse`,
`success`, `warning`, `error`.

```tsx
<Text variant="eyebrow" tone="accent">Ventas comprobadas</Text>
<Text variant="display">Qué vender hoy</Text>
```

El `className` de `Text` sirve para COLOCAR (margen, ancho, alineación), nunca para cambiar cuerpo o
color: el orden de la hoja generada decide quién gana y una clase de color ahí puede quedarse sin
efecto sin dar ningún aviso. Si hace falta otro color, es que falta un tono.

## Iconos

**Lucide** (`lucide-react-native`), con trazo de **1,5**. Es lo que hace que el icono y la letra
parezcan de la misma mano: Lucide viene a 2 y junto a Roboto Light se ve tosco.

Siempre a través de `<Icon glyph={ShoppingBag} size="md" tone="muted" />`, que centraliza tamaño,
trazo y color del tema. Tamaños: `sm` 14, `md` 18, `lg` 22, `xl` 28.

Antes de esto la aplicación no tenía familia de iconos: había estrellas y lupas dibujadas con
`View`s giradas, y emojis (🔔 💳 ⭐) haciendo de iconografía en la pantalla de cuenta.

## El tema vive en las variables

`global.css` declara el tema en variables CSS y `tailwind.config.js` las referencia. NativeWind las
resuelve en tiempo de ejecución, así que **el modo oscuro sale solo**: al cambiar el sistema se
repinta la aplicación entera sin que ninguna pantalla consulte el esquema ni duplique clases `dark:`.

Antes cada `text-base-content` apuntaba al valor claro escrito a fuego: la aplicación se declaraba
`userInterfaceStyle: 'automatic'` y salía siempre en claro.

Los valores van en canales sueltos (`12 74 151`) para que las opacidades de utilidad
(`text-base-content/60`, `bg-primary/10`) sigan funcionando.

`src/design-system/tokens/colors.ts` es el ESPEJO de esas variables, y existe solo para lo que exige
un color literal y no admite clases: las opciones del navegador, `ActivityIndicator`, el trazo de un
icono, el formulario nativo de tarjeta. Se lee con `useTheme()`. Si se cambia un valor en un sitio
hay que cambiarlo en el otro.

## Los componentes

Todo en `src/design-system/components`, todo exportado por `@ds/components`.

| Componente | Para qué |
|---|---|
| `Text` | El texto, con papel y tono |
| `Icon` | Un icono de Lucide con el trazo y el tema del sistema |
| `BrandMark` | El logotipo: el `circle-nodes` del escaparate más «NX036» |
| `Button` | Cinco variantes, tres tamaños, iconos a los dos lados |
| `Card` | Contenedor de bloque: con borde, elevada o plana |
| `Badge` | Distintivo corto: rebaja, estado, cuenta |
| `Chip` | Filtro o categoría de una fila desplazable |
| `Checkbox` | Casilla, con hueco debajo para enlaces legales |
| `ListRow` | Fila de navegación de una lista de ajustes |
| `OptionRow` | Opción de una lista donde solo se elige una |
| `Sheet` | Hoja que sube desde abajo |
| `Skeleton` | Hueco que late mientras llega el contenido |
| `Rating` | Valoración en estrellas |
| `PriceTag` | Precio, tachado y porcentaje de rebaja |
| `TextField` / `PasswordField` | Campos con icono, foco visible y aclaración |
| `Alert` | Aviso con icono y rol de alerta |
| `Screen` | Armazón de pantalla: superficie, área segura, teclado |
| `Divider` | Separador con rótulo |

## Reglas que no se negocian

1. **Nada de emojis ni de iconos dibujados con `View`s.** Si falta un icono, está en Lucide.
2. **El precio no se calcula ni se formatea en la aplicación.** Llega formateado del backend. La app
   solo lo pinta. Un importe calculado aquí deja de coincidir con lo que se cobra en cuanto cambia
   una regla de margen.
3. **Accesibilidad en todo lo pulsable**: `accessibilityRole`, `accessibilityLabel` y
   `accessibilityState`. Además de ser correcto, es lo que permite probar las pantallas por etiqueta
   en vez de por estructura.
4. **Un hueco que late, no un «Cargando…»**. Los esqueletos repiten la forma de lo que va a llegar.
5. **El vacío es una invitación**: título, explicación y una salida. Nunca una pantalla en blanco.
