# Certificación de la app móvil NX036

Fecha: 9 de septiembre de 2026.
Alcance: rediseño completo de la interfaz, iconografía, tipografía y las opciones de comercio que
faltaban, más la verificación de que todo ello sigue en pie.

## Punto de partida

Antes de tocar nada, para saber de dónde se sale:

- `tsc --noEmit`: limpio.
- `eslint .`: limpio.
- `jest`: **144 suites, 1023 pruebas, todas en verde**.

## Defectos encontrados

Los ocho primeros son de la aplicación tal como estaba; el noveno lo introdujo este mismo trabajo y
se corrigió antes de cerrar.

### 1. El modo oscuro no existía, pero la aplicación decía que sí

`app.config.ts` declaraba `userInterfaceStyle: 'automatic'` y `_layout.tsx` montaba
`<StatusBar style="auto" />`, pero **todos** los colores estaban escritos contra el tema claro: las
clases `text-base-content`, `bg-base-100`… apuntaban a valores fijos y no había una sola variante
`dark:` en todo el proyecto. Las constantes `colors.dark` existían y solo las usaba la barra de
pestañas.

Consecuencia: en un teléfono con tema oscuro la aplicación salía en claro, y la barra de estado —que
sí obedecía al sistema— pintaba sus iconos en blanco sobre el fondo blanco de la aplicación.

**Corregido**: el tema pasa a variables CSS en `global.css`, que NativeWind resuelve en ejecución.
El modo oscuro sale solo, sin duplicar una sola clase.

### 2. No había familia de iconos

La aplicación no incorporaba ninguna, y se notaba: la estrella de valoración era la unión de dos
cuadrados girados, la llama de ventas una gota con tres esquinas redondeadas, la lupa del buscador un
círculo con una línea a −45°, el ojo de la contraseña tres vistas superpuestas, el triángulo de vídeo
un bloque sin tamaño con un solo borde. En la pantalla de cuenta, siete **emojis** hacían de
iconografía (🔔 🧾 ❤️ 💳 ⭐ 🌍 🔒), que cada sistema operativo dibuja a su manera.

**Corregido**: Lucide con trazo 1,5 a través de un componente `Icon` que centraliza tamaño y tema.

### 3. La mitad de la aplicación no usaba la tipografía de la marca

26 ficheros pintaban con el `Text` de React Native, que no hereda ni familia ni color: salían con la
letra del sistema (Roboto solo por casualidad en Android; en iOS, San Francisco) y con el negro por
omisión. Además, cada pantalla decidía su propio tamaño a mano (`text-[13px] leading-[18px]`).

**Corregido**: un `Text` propio con papeles y tonos, y la escala cerrada en `tailwind.config.js`.

### 4. El catálogo ocultaba los filtros que el backend ya servía

`ProductFilters` soportaba orden, precio mínimo y máximo, valoración mínima y «solo con vídeo», y el
caso de uso los pasaba al servidor. La pantalla no ofrecía **ninguno**: solo búsqueda por texto y
categoría.

**Corregido**: hoja de «Ordenar y filtrar» con los seis criterios y un distintivo que dice cuántos
están puestos, porque un filtro activo que no se ve hace parecer que el catálogo está roto.

### 5. La libreta de direcciones solo existía dentro de una compra

Los casos de uso `listAddresses` y `createAddress` estaban en el contenedor y solo los usaba el
checkout. Para ver o dar de alta una dirección había que empezar un pedido.

**Corregido**: pantalla propia en Cuenta → Direcciones.

### 6. Añadir a la cesta no dejaba ninguna señal

El botón cambiaba a «Añadido» durante dos segundos y nada más. La pestaña de la cesta no decía
cuántas unidades esperaban, así que había que entrar a comprobar si el toque había servido.

**Corregido**: contador sobre la pestaña, en un almacén compartido que se pone al día desde la ficha
y desde la propia cesta.

### 7. Las pantallas de ajustes se abrían sin título

`Stack` va con `headerShown: false`, así que Seguridad, Idioma y divisa, Eliminar cuenta y Recargar
aparecían empezando directamente por su primer campo, sin decir dónde estabas.

**Corregido**: todas llevan cabecera.

### 8. El formulario de tarjeta se quedaba en claro

`AddCardScreen` calculaba los colores del componente nativo de Stripe en una constante de módulo,
contra `colors.light`. Al no ser una clase, no había forma de que siguiera al tema.

**Corregido**: los colores se recalculan desde la paleta activa.

### 9. La píldora de categoría perdió su nombre accesible (introducido aquí)

Al pasar `CategoryChips` al componente `Chip` del sistema se perdió el `accessibilityLabel`. Lo
detectaron las pruebas de `CategoryChips`, que localizan las píldoras por etiqueta.

**Corregido** en el mismo pase.

## Recorrido real en el emulador

Compilado con `./gradlew installRelease -PreactNativeArchitectures=x86_64` —APK con el JavaScript
dentro, sin servidor Metro— e instalado en el emulador `nx036`, contra el backend local.

Recorrido: acceso → portada → catálogo → filtros → ficha → variantes → cesta → cuenta. Todo con datos
reales del catálogo (7.729 referencias).

### Defectos que encontró el recorrido

#### 10. La cesta no se recargaba al volver a su pestaña

**El más grave de todos.** Se añade un producto desde la ficha, el contador de la pestaña sube a 1
y, al entrar en la cesta, dice «Tu cesta está vacía». El producto estaba guardado —cerrando y
abriendo la aplicación aparecía—, pero la pantalla seguía enseñando lo que leyó la primera vez.

La causa: las pestañas se quedan montadas, y la cesta cargaba sus líneas en un efecto de montaje.
Nadie lo había visto antes porque sin contador no había forma de saber que faltaba algo.

**Corregido**: la cesta recarga con `useFocusEffect`, cada vez que la pestaña vuelve al frente.

#### 11. Los rótulos de la barra de pestañas, bajo la barra de gestos

«Guardados» salía partido por la raya de navegación de Android. Lo introdujo este trabajo, al fijar
un alto de 60 px en la barra: con un alto escrito a mano, React Navigation deja de sumarle el margen
inferior del sistema.

**Corregido**: sin alto fijo.

#### 12. El botón de aplicar los filtros quedaba fuera de la pantalla

La hoja de «Ordenar y filtrar» tiene siete criterios de orden, dos campos de precio y cuatro de
valoración: con los botones dentro del desplazamiento había que recorrerlo entero para aplicar lo
que ya se había elegido arriba.

**Corregido**: el pie vuelve a ser fijo, y el formulario se remonta con una `key` en lugar de
sincronizarse con un efecto —que era lo que había obligado a moverlo—.

#### 13. El distintivo de «Vídeo» se metía debajo del reloj

La galería sube hasta el borde de la pantalla y el distintivo iba a 12 px del borde superior, encima
de la hora y de los iconos del sistema.

**Corregido**: pasa a la esquina inferior izquierda de la galería.

### Defectos que NO son de la aplicación

- **El backend responde en inglés.** `POST /api/auth/login` con `X-Lang: es` y credenciales malas
  devuelve `{"code":"SE002","message":"Unauthorized"}`. La aplicación lo pinta tal cual, porque por
  norma del proyecto los textos de error los traduce el servidor. **Hay que traducirlo en el
  backend**; ningún cambio en la app arregla esto sin romper esa norma.
- **Las imágenes no cargan en el emulador.** El backend sirve `mainImage` como
  `http://localhost:9100/product-images/...`, y dentro del emulador `localhost` es el propio
  emulador, no la máquina de desarrollo. Es una trampa del entorno local, no un fallo de la app: hay
  que servir esas URLs con `10.0.2.2` para poder certificar la parte visual del catálogo.
- **Tallas con ideogramas.** Una variante se anuncia como `Blanco / L【105-130斤】`. Es dato del
  catálogo pendiente de traducir, no de la aplicación.

## Segunda vuelta: navegación, tipografía y paridad con el escaparate

### 14. Pantallas sin salida visible

Once pantallas se abrían desde una lista y no ofrecían forma de volver: el navegador va sin cabecera
—la ficha necesita que la galería suba hasta el borde de la pantalla— y al quitarla se quedaron sin
salida las demás. En Android lo disimulaba el gesto del sistema; en iOS habrían sido callejones sin
salida.

**Corregido**: componente `ScreenHeader` con la flecha en la misma línea que el título. Probado: la
flecha vuelve.

### 15. Dos escalas distintas para lo mismo

El título de pantalla medía 32 px en unas y 22 px en otras. A esas pantallas se entra desde una
lista: el rótulo confirma dónde estás, no encabeza nada.

**Corregido**: 17 px en todas. El cuerpo mayor queda en dos sitios donde gana algo: el titular de la
portada y el saldo del monedero, que es una cifra.

### 16. El icono de la aplicación era el de Expo

Una «A» azul con degradado, sin relación con la marca.

**Corregido**: el `circle-nodes` blanco sobre cobalto —el mismo símbolo del icono de pestaña del
escaparate— en las cinco densidades y en los tres formatos que pide Android: clásico, adaptativo y
monocromo.

### 17. La aplicación tiraba a la basura datos que la API ya mandaba

`dutyCovered` y `shippingCovered` venían en cada producto del listado y el contrato de la aplicación
no los declaraba. En el escaparate son dos iconos verdes —la mano que paga el arancel y el camión del
porte— y en la aplicación no había NADA: quien compraba desde el móvil no veía que la tienda pone
parte del coste.

**Corregido**: los dos campos entran en el DTO, en la entidad y en la tarjeta, con los mismos iconos
y sin cifra, por lo mismo que hace el escaparate —con letra competirían con el precio—.

### 18. No se podía comprar sin entrar en la ficha

El escaparate ofrece compra rápida en cada tarjeta; la aplicación obligaba a entrar y salir de una
ficha por cada referencia.

**Corregido**: botón «Añadir» al pie de la tarjeta, en portada y catálogo.

### 19. La compra rápida guardaba la línea SIN variante (lo cazó la certificación)

La primera versión del botón añadía sin más. Probado en el emulador con un producto que tiene
colores: **se añadió igual y el contador subió**. Es el mismo defecto que ya se había corregido en la
ficha —comprar sin elegir—, reintroducido por la puerta de atrás.

**Corregido** replicando lo que hace el escaparate: se pide la ficha y se toma la primera variante
activa con existencias (`firstAvailableVariant`, en el dominio y con sus pruebas). Si el producto
tiene ejes y ninguna sirve, no se añade nada y se dice por qué. La cantidad respeta el pedido mínimo.

### 20. El botón decía «Añadi»

React Native encoge el texto antes que el icono dentro de una fila, y se comía la última letra sin
puntos suspensivos que avisaran de que faltaba algo.

**Corregido** con `shrink-0`.

### 21. Los bloques de la portada escondían seis de cada ocho productos

Cada sección trae ocho productos y el carrusel horizontal enseñaba dos y medio; el resto quedaba
detrás de un gesto que casi nadie hace.

**Corregido**: rejilla de dos columnas, la misma del catálogo.

## Tercera vuelta: acabado de la cuenta, los pedidos y las pantallas de acceso

Barrido de las pantallas que quedaban —pedidos, seguridad, idioma y divisa, registro, activación y
recuperación— mirando píxeles, no código. Casi nada de esto da error: la pantalla se pinta, la
compra funciona y el defecto solo se ve.

### 22. El relleno de una tarjeta se borraba al pedirle cualquier otra cosa

`Card` tenía el relleno como valor por omisión de `className`. Escribir `className="gap-1"` para
separar dos líneas lo borraba entero, sin decir nada: en el detalle del pedido, cuatro tarjetas
tenían el texto pegado al borde mientras las de al lado sí respiraban.

**Corregido**: el relleno es una propiedad propia (`padding`) y `className` ya no puede llevárselo
por delante. Un ajuste no puede deshacer otro que no se ha nombrado.

### 23. La última fila de cada grupo colgaba una línea suelta

Cuatro pantallas —idioma y divisa, monedero, seguridad y recarga— dibujaban un separador debajo de
CADA fila, incluida la última, que quedaba con una raya flotando sobre el borde de su propia
tarjeta.

**Corregido**: `OptionRow` y las filas de esas listas saben cuál es la última y no la pintan.

### 24. La marca de «elegido» era el carácter `✓`

Idioma y divisa, la recarga y el formulario de dirección pintaban la marca de selección como una
letra, con el tamaño y el trazo de una letra, en una aplicación en la que todo lo demás son iconos
de Lucide. La lista de requisitos de la contraseña hacía lo mismo con `✓` y `○`.

**Corregido**: iconos `Check` y `Circle` del sistema. Y el formulario de dirección, que además se
había hecho su propia casilla de verificación a mano, usa la del sistema de diseño.

### 25. La rueda de espera salía del color de Android, no de la marca

Nueve pantallas pintaban un `ActivityIndicator` sin `color`: Android lo dibuja de su verde azulado
de serie. En idioma y divisa quedaba un punto de un color que no está en la paleta en mitad de una
tarjeta vacía.

**Corregido**: un `Spinner` del sistema de diseño que siempre lee el color de marca. Nadie vuelve a
escribir el indicador a pelo.

### 26. El botón deshabilitado era el mismo botón, translúcido

Con la opacidad al 50 %, «Guardar contraseña» quedaba en azul lavado con la letra blanca encima: se
leía mal y seguía pareciendo pulsable.

**Corregido**: apagado es un relleno neutro con la tinta media. Cargando, en cambio, conserva su
color: el botón sí está activo, solo está ocupado.

### 27. El detalle del pedido no enseñaba el número del pedido

La cabecera del navegador pone «Pedido» y justo debajo había otra línea que también ponía «Pedido».
La referencia —lo único que se copia para preguntar por él— no salía en ninguna parte.

**Corregido**: antetítulo, número seleccionable y el estado como distintivo. El distintivo, además,
es ahora el MISMO componente en la lista y en el detalle: antes el mismo «Pagado» era una insignia
en una pantalla y una línea de texto suelta en la otra.

### 28. Una tarjeta de pedido no parecía pulsable

Sin flecha ni destello al tocarla, la ficha del pedido se leía como un resumen. Es la única forma de
llegar al seguimiento del envío.

**Corregido**: flecha a la derecha y respuesta al pulsar.

### 29. Un artículo sin foto parecía un fallo de carga

En un pedido con dos líneas del mismo producto, una enseñaba su foto y la otra un rectángulo gris.
Parecía que la imagen estaba por llegar; en realidad esa variante no tiene foto y no iba a llegar
nunca.

**Corregido**: icono de «sin imagen» dentro del hueco.

### 30. El país se tecleaba como código de dos letras

En el alta de dirección y en el registro. Nadie sabe de memoria que Emiratos es «AE», y un código
inventado no daba error: se guardaba la dirección y el fallo asomaba mucho después, al no poder
cotizar el envío. En el registro era peor todavía, porque de ese país salen el margen y los
impuestos de la cuenta.

**Corregido**: se elige de la cobertura REAL del transportista (`GET /api/shipping/countries`, que ya
existía y nadie consumía), con buscador que no exige poner las tildes. El idioma del registro, igual:
de la lista de diccionarios publicados.

### 31. Recuperar la contraseña dejaba enviar el formulario vacío

Pulsar «Enviarme el código» sin escribir el correo llamaba al servidor y pasaba al segundo paso, a
esperar un código que no iba a llegar. Y una vez en el segundo paso no había forma de volver a
corregir el correo salvo salir al acceso y entrar de nuevo.

**Corregido**: el botón no se activa sin correo, la pantalla dice en qué paso está y hay una salida
de vuelta.

### 32. Activar la cuenta y cambiar la contraseña terminaban en silencio

Las dos pantallas escribían su mensaje de éxito y navegaban acto seguido: el aviso quedaba pintado
durante un fotograma y nadie llegaba a leerlo.

**Corregido**: el aviso lo da la pantalla de acceso, que es donde se aterriza. Viaja como una CLAVE y
no como texto: a esa ruta se llega también desde un enlace externo, y aceptar una frase suelta
dejaría escribir cualquier cosa sobre nuestro formulario de acceso.

### 33. Tres cabeceras seguidas diciendo lo mismo

«Recupera el acceso a tu cuenta», «Recuperar contraseña» y «Escribe el correo de tu cuenta y te
enviaremos un código». Lo mismo en la activación.

**Corregido**: una sola instrucción arriba y el título del paso debajo.

### 34. La talla salía en chino dentro de un pedido pagado

`L【105-130斤】`. No era un fallo de traducción: el valor viajaba en las opciones de la variante pero
nunca se dio de alta como valor del eje, así que no había nada que traducir y pasaba el texto del
proveedor tal cual. Dos productos de todo el catálogo, restos de una carga antigua.

**Corregido en los datos**, con sus siete traducciones, y con dos guiones en
`backend/scripts/catalogo/`: uno que los detecta y otro que los repara. La detección hace falta
porque el fallo no deja ningún rastro: la ficha se pinta, el pedido se paga y el chino solo se ve
mirando la pantalla.

### 35. El acceso fallido contestaba «Unauthorized»

Con el idioma en español. El manejador de errores escribía el texto a mano y en el catálogo de
mensajes no había ningún código de seguridad, así que la traducción devolvía nulo y pasaba el
literal inglés.

**Corregido**: `SE001`, `SE002`, `MFA_REQUIRED` y `MFA_INVALID` entran en `ErrorCode` con sus ocho
idiomas. El texto sigue siendo el MISMO para todos los motivos —contraseña mala, cuenta sin activar,
bloqueada o inexistente—: traducirlo no puede convertirlo en un delator de qué cuentas existen.

### 36. Faltaba el historial de visitas que la web sí tiene

El backend ya lo servía entero —`GET /api/me/product-views`, con su correo de recordatorio cada tres
días— y la aplicación no lo pedía ni lo alimentaba: quien miraba una ficha desde el móvil no dejaba
rastro, y el correo hablaba de productos que en la aplicación no aparecían.

**Corregido**: la ficha anota la visita al abrirse y «Lo que has visto» vive en la pestaña de cuenta,
al lado de «Guardados». Se lee del MISMO endpoint que la web: dos historiales distintos habrían
hecho que el correo y la aplicación se contradijeran.

## Auditoría de tipografía

Hecha sobre el código, no a ojo:

- **Textos con la letra del sistema**: ninguno. Todo pasa por el `Text` del sistema de diseño, así
  que todo va en Roboto.
- **Tamaños escritos a mano**: ninguno. La escala está cerrada en `tailwind.config.js`.
- **Familias sueltas**: solo las dos de la barra de pestañas, que se configuran con objetos de estilo
  y quedan fuera del alcance de NativeWind. Pasan a leer los tokens en lugar de repetir el literal.
- **Reparto de papeles**: 89 rótulos, 73 textos auxiliares, 25 encabezados, 11 antetítulos, 7 cuerpos,
  6 títulos, 3 precios y 2 titulares. Es el reparto de una aplicación de listas, que es lo que es.

## Cambios de comportamiento que había que reflejar en las pruebas

No son defectos: son decisiones de diseño que rompieron una expectativa escrita.

| Prueba | Antes | Ahora | Por qué |
|---|---|---|---|
| `ProductCard` | `−38%` | `−38 %` | En español el símbolo de porcentaje va separado del número |
| `StorefrontScreen` | «productos listos para revender» | «N referencias» + «Qué vender hoy» | La portada declara el negocio, no describe el catálogo |
| `AddressPicker` | «Cargando direcciones…» | Huecos con la forma de las tarjetas | Un texto de carga no dice cuánto falta ni qué va a venir |
| `CheckoutScreen` | «Aplicar cupón» | «Aplicar» | El botón va pegado al campo y el rótulo largo no cabía |
| `ProductDetailScreen` | El precio una vez | Dos veces | La barra de compra fija lo mantiene a la vista al bajar por la ficha |

## Deuda que este trabajo deja pagada

- `expo-linear-gradient` y `@expo/vector-icons` se quedan sin ningún uso al retirar `BrandHeader` y
  los iconos de Ionicons.
- La configuración de Jest necesitaba una entrada nueva: `lucide-react-native` publica su campo
  `react-native` apuntando a un `.mjs`, y el transformador de Babel solo mira `.js`/`.jsx`/`.ts`/
  `.tsx`. Se resuelve apuntando al CommonJS que el propio paquete trae, no ampliando
  `transformIgnorePatterns` —la lista no era el problema, la extensión sí—.
- Los ayudantes de render de las pruebas montan ahora el área segura, como hace el layout raíz.
