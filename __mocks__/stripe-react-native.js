const React = require('react')
const { TextInput } = require('react-native')

/**
 * Sustituto del SDK nativo de la pasarela, que en Jest no existe: importarlo de verdad falla con
 * «NativeModule … is null», igual que AsyncStorage. A diferencia de aquél, la librería no publica
 * ninguno, así que se escribe aquí.
 *
 * Vive en un fichero propio y no dentro de la factoría de `jest.mock` —que es donde lo declara
 * `jest.setup.js`— por la misma razón que el sustituto de expo-router: esa factoría se eleva por
 * encima del módulo y no puede referenciar nada de fuera, ni siquiera las funciones que el preset de
 * NativeWind inyecta al transformar los componentes.
 *
 * `StripeProvider` conserva la clave que recibe como propiedad de una vista corriente, para que las
 * pruebas puedan comprobar que sale del backend y no del código. `CardField` se sustituye por un
 * campo de texto: en un componente nativo no hay forma de teclear desde Jest, y así la prueba
 * escribe un número y el formulario se entera por el mismo `onCardChange` que usa el de verdad.
 */

/** Lo que el SDK da por completo: los 15 dígitos del número de tarjeta más corto que existe (Amex). */
const COMPLETE_DIGITS = 15

function StripeProvider({ children, publishableKey, urlScheme }) {
  return React.createElement(
    'StripeProvider',
    { testID: 'stripe-provider', publishableKey, urlScheme },
    children,
  )
}

function CardField({ accessibilityLabel, testID, onCardChange }) {
  return React.createElement(TextInput, {
    accessibilityLabel,
    testID,
    onChangeText: (value) => {
      const digits = String(value).replace(/\D/g, '')
      onCardChange?.({ complete: digits.length >= COMPLETE_DIGITS, brand: 'Visa' })
    },
  })
}

module.exports = {
  StripeProvider,
  CardField,
  initStripe: jest.fn(),
  confirmSetupIntent: jest.fn(),
  handleNextAction: jest.fn(),
}
