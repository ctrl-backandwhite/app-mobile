#!/usr/bin/env bash
# Comprueba que la URL del backend queda DENTRO del paquete compilado.
#
# Existe por un fallo real: Babel sustituye `process.env.EXPO_PUBLIC_*` por su valor solo cuando el
# acceso a la propiedad está escrito literalmente. Al leerlo de otra forma, el paquete salía sin la
# URL y la aplicación se cerraba nada más abrirse... pero en desarrollo funcionaba, porque Metro
# inyecta el entorno entero. La compilación decía «finished» y el fallo solo aparecía en el móvil.
set -euo pipefail

URL="${EXPO_PUBLIC_API_BASE_URL:-}"
if [ -z "$URL" ]; then
  echo "Define EXPO_PUBLIC_API_BASE_URL antes de ejecutar esto." >&2
  exit 1
fi

SALIDA=$(mktemp -d)
trap 'rm -rf "$SALIDA"' EXIT

# EXPO_NO_DOTENV=1: sin esto, el .env del equipo pisaría la URL que se quiere comprobar y el
# resultado hablaría del entorno local en vez de del que se va a publicar.
# --clear es imprescindible: Metro cachea las transformaciones y un cambio en las variables
# EXPO_PUBLIC_* NO invalida esa caché, así que sin esto se comprobaría el paquete de la exportación
# anterior y daría un resultado falso.
EXPO_NO_DOTENV=1 npx expo export --clear --platform android --output-dir "$SALIDA" >/dev/null 2>&1
BUNDLE=$(find "$SALIDA" \( -name '*.hbc' -o -name '*.bundle' \) | head -1)

if [ -z "$BUNDLE" ]; then
  echo "No se ha generado ningún paquete." >&2
  exit 1
fi

ESPERADA="${URL#https://}"
ESPERADA="${ESPERADA#http://}"

# Las cadenas se vuelcan a un fichero en lugar de encadenar `strings | grep -q`: `grep -q` corta la
# tubería en cuanto encuentra, `strings` muere con SIGPIPE y `pipefail` lo convierte en un fallo del
# pipeline, así que la comprobación daba negativo aun estando la URL presente.
CADENAS="$SALIDA/cadenas.txt"
strings "$BUNDLE" > "$CADENAS"

if grep -qF "$ESPERADA" "$CADENAS"; then
  echo "OK: el paquete lleva la URL del backend ($URL)."
  exit 0
fi

echo "FALLO: el paquete NO lleva la URL esperada ($URL)." >&2
echo "Direcciones que sí aparecen en el paquete:" >&2
grep -oE "[a-z0-9.-]+\.(up\.railway\.app|com|local)|[0-9]{1,3}(\.[0-9]{1,3}){3}:[0-9]+" "$CADENAS" \
  | sort -u | head -5 >&2
echo "Si no aparece ninguna, revisa que en src/core/config/env.ts se acceda a" >&2
echo "process.env.EXPO_PUBLIC_* de forma literal; Babel no sustituye otros accesos." >&2
exit 1
