import * as WebBrowser from 'expo-web-browser'

import { ExpoPaymentApprovalGateway } from '../repositories/expo-payment-approval.gateway'

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }))

const browser = WebBrowser as jest.Mocked<typeof WebBrowser>

const APPROVAL_URL = 'https://www.paypal.com/checkoutnow?token=1'

describe('ExpoPaymentApprovalGateway', () => {
  beforeEach(() => jest.clearAllMocks())

  /**
   * El enlace de vuelta tiene que ser el DEL PAGO. Antes se pasaba el del acceso
   * (`nx036://auth/callback`), al que la pasarela no vuelve nunca: la vista de navegador no se
   * cerraba sola, la persona la cerraba a mano y eso se leía como cancelado HABIENDO PAGADO. El
   * pedido quedaba pendiente y se podía volver a cobrar.
   */
  it('abre la pasarela con el enlace de vuelta del pago, no el del acceso', async () => {
    browser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'nx036://pago/retorno' } as never)

    const result = await new ExpoPaymentApprovalGateway().approve(APPROVAL_URL)

    expect(browser.openAuthSessionAsync).toHaveBeenCalledWith(APPROVAL_URL, 'nx036://pago')
    expect(result.ok && result.value).toBe('approved')
  })

  /**
   * Las dos vueltas —aprobado y cancelado— cierran la vista, así que el tipo de resultado no las
   * distingue. Sin mirar a cuál se ha vuelto, cancelar en PayPal se leería como pagado.
   */
  it('distingue la vuelta de cancelación de la de aprobación', async () => {
    browser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'nx036://pago/cancelado',
    } as never)

    const result = await new ExpoPaymentApprovalGateway().approve(APPROVAL_URL)

    expect(result.ok && result.value).toBe('cancelled')
  })

  it('trata la vuelta sin completar como cancelación, no como fallo', async () => {
    browser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' } as never)

    const result = await new ExpoPaymentApprovalGateway().approve(APPROVAL_URL)

    expect(result.ok && result.value).toBe('cancelled')
  })

  it('no abre una dirección que no sea del proveedor', async () => {
    // Abrir cualquier cosa convertiría la app en un redirector hacia páginas que imiten la pasarela.
    const result = await new ExpoPaymentApprovalGateway().approve('nx036://pagado')

    expect(browser.openAuthSessionAsync).not.toHaveBeenCalled()
    expect(!result.ok && result.error.code).toBe('VALIDATION')
  })

  it('informa si el navegador del sistema no se puede abrir', async () => {
    browser.openAuthSessionAsync.mockRejectedValue(new Error('sin navegador'))

    const result = await new ExpoPaymentApprovalGateway().approve(APPROVAL_URL)

    expect(!result.ok && result.error.code).toBe('UNKNOWN')
  })
})
