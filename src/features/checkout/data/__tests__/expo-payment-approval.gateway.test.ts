import * as WebBrowser from 'expo-web-browser'

import { ExpoPaymentApprovalGateway } from '../repositories/expo-payment-approval.gateway'

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }))

const browser = WebBrowser as jest.Mocked<typeof WebBrowser>

const APPROVAL_URL = 'https://www.paypal.com/checkoutnow?token=1'

describe('ExpoPaymentApprovalGateway', () => {
  beforeEach(() => jest.clearAllMocks())

  it('abre la pasarela en el navegador del sistema con el enlace de vuelta de la app', async () => {
    browser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'nx036://auth/callback' } as never)

    const result = await new ExpoPaymentApprovalGateway().approve(APPROVAL_URL)

    expect(browser.openAuthSessionAsync).toHaveBeenCalledWith(APPROVAL_URL, 'nx036://auth/callback')
    expect(result.ok && result.value).toBe('approved')
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
