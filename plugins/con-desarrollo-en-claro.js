const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Permite HTTP SIN CIFRAR únicamente contra la máquina de desarrollo.
 *
 * <p>Desde Android 9 el tráfico en claro está prohibido por defecto. En las compilaciones de
 * desarrollo Expo lo permite, pero en RELEASE no: la app compilada así no puede hablar con un backend
 * local en `http://10.0.2.2:18082` y falla con «No hay conexión con el servidor», que no dice nada
 * del motivo real.
 *
 * <p>La excepción se declara por DOMINIO y no con `usesCleartextTraffic`, que abriría el HTTP en claro
 * contra cualquier destino también en la aplicación que se publica. Aquí solo entran las direcciones
 * con las que un emulador o un dispositivo en la red local alcanzan esta máquina; todo lo demás sigue
 * exigiendo HTTPS, incluida la tienda de verdad.
 */
const DOMINIOS_DE_DESARROLLO = [
  '10.0.2.2', // el host visto desde el emulador de Android
  '10.0.3.2', // lo mismo en Genymotion
  'localhost',
  '127.0.0.1',
];

/**
 * Direcciones de esta máquina en la red local.
 *
 * <p>Hacen falta porque hay servicios de desarrollo a los que NO se llega por `10.0.2.2`: las fotos
 * de producto se sirven con una dirección que tiene que valer a la vez para el navegador del
 * escritorio y para el emulador, y esa solo puede ser la de la máquina en la red. Sin esta excepción
 * Android corta la descarga en silencio y el catálogo sale sin una sola foto —lo que parece un fallo
 * de la aplicación y no lo es—.
 *
 * <p>Se calculan al compilar en lugar de escribirse a mano: la dirección cambia de una red a otra, y
 * una lista fija obligaría a editar este fichero cada vez.
 *
 * <p>NO entran en la compilación de producción: allí todo va por HTTPS y meter la dirección privada
 * de la máquina que compiló solo sería ruido dentro del paquete publicado.
 */
function direccionesDeLaRedLocal() {
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    return [];
  }
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((interfaz) => interfaz && interfaz.family === 'IPv4' && !interfaz.internal)
    .map((interfaz) => interfaz.address);
}

const DOMINIOS = [...DOMINIOS_DE_DESARROLLO, ...direccionesDeLaRedLocal()];

const CONFIGURACION = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Generado por plugins/con-desarrollo-en-claro.js. No editar a mano: se reescribe en cada prebuild.
-->
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
${DOMINIOS.map((d) => `    <domain includeSubdomains="false">${d}</domain>`).join('\n')}
  </domain-config>
</network-security-config>
`;

module.exports = function conDesarrolloEnClaro(config) {
  const conFichero = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const destino = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/res/xml/network_security_config.xml',
      );
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, CONFIGURACION);
      return cfg;
    },
  ]);

  return withAndroidManifest(conFichero, (cfg) => {
    const aplicacion = cfg.modResults.manifest.application?.[0];
    if (aplicacion) {
      aplicacion.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });
};
