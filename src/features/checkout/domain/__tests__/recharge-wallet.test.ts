import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { isValidRechargeAmount, Recharge } from '../entities/wallet-recharge'
import { CardAuthenticator } from '../ports/card-authenticator'
import { ApprovalOutcome, PaymentApprovalGateway } from '../ports/payment-approval-gateway'
import { WalletRepository } from '../ports/wallet-repository'
import { GetRechargeOptions, RechargeWallet } from '../usecases/recharge-wallet'

const CON_TARJETA: Recharge = {
  paymentId: 'p-1',
  status: 'PENDING',
  chargeFormatted: '25,00 €',
  clientSecret: 'secreto',
}

const CON_PAYPAL: Recharge = {
  paymentId: 'p-2',
  status: 'PENDING',
  chargeFormatted: '25,00 €',
  approveUrl: 'https://paypal.test/aprobar',
}

function monedero(overrides: Partial<WalletRepository> = {}): WalletRepository {
  return {
    balance: jest.fn(),
    transactions: jest.fn(),
    rechargeOptions: jest.fn().mockResolvedValue(ok({ currency: 'EUR', symbol: '€', presets: [] })),
    startRecharge: jest.fn().mockResolvedValue(ok(CON_TARJETA)),
    confirmRecharge: jest.fn().mockResolvedValue(ok(undefined)),
    capturePayPal: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  }
}

/**
 * Los tipos van escritos y no inferidos: con los valores por defecto, TypeScript fija el resultado en
 * el caso concreto que se pasa —«approved», error `never`— y cualquier prueba que use el otro deja de
 * compilar. Las pruebas seguirían en verde porque Jest no mira los tipos, y solo lo caza `tsc`.
 */
function banco(result: Result<void, AppError> = ok(undefined)): CardAuthenticator {
  return { authenticate: jest.fn().mockResolvedValue(result) }
}

function navegador(
  result: Result<ApprovalOutcome, AppError> = ok('approved'),
): PaymentApprovalGateway {
  return { approve: jest.fn().mockResolvedValue(result) }
}

const PETICION = { method: 'CARD' as const, amount: 25, currency: 'EUR' }

describe('isValidRechargeAmount', () => {
  it('acepta un importe mayor que cero', () => {
    expect(isValidRechargeAmount(0.5)).toBe(true)
  })

  it('rechaza el cero, lo negativo y lo que no es número', () => {
    expect(isValidRechargeAmount(0)).toBe(false)
    expect(isValidRechargeAmount(-5)).toBe(false)
    expect(isValidRechargeAmount(Number.NaN)).toBe(false)
  })
})

describe('GetRechargeOptions', () => {
  it('pide los importes sugeridos en la divisa activa', async () => {
    const rechargeOptions = jest
      .fn()
      .mockResolvedValue(ok({ currency: 'EUR', symbol: '€', presets: [] }))

    await new GetRechargeOptions(monedero({ rechargeOptions })).execute('EUR')

    expect(rechargeOptions).toHaveBeenCalledWith('EUR')
  })
})

describe('RechargeWallet · con tarjeta', () => {
  it('supera el reto del banco y CIERRA el cobro contra el servidor', async () => {
    const wallet = monedero()
    const autenticador = banco()

    const result = await new RechargeWallet(wallet, autenticador, navegador()).execute(PETICION)

    expect(autenticador.authenticate).toHaveBeenCalledWith('secreto')
    // El reto solo acredita a la persona: quien decide si el saldo sube es el backend.
    expect(wallet.confirmRecharge).toHaveBeenCalledWith('p-1')
    expect(result.ok && result.value).toBe('recharged')
  })

  it('manda el importe en la divisa activa, sin convertir', async () => {
    const startRecharge = jest.fn().mockResolvedValue(ok(CON_TARJETA))

    await new RechargeWallet(monedero({ startRecharge }), banco(), navegador()).execute(PETICION)

    expect(startRecharge).toHaveBeenCalledWith({ method: 'CARD', amount: 25, currency: 'EUR' })
  })

  it('no cierra el cobro si el banco rechaza el reto', async () => {
    const wallet = monedero()

    const result = await new RechargeWallet(
      wallet,
      banco(err(new AppError('VALIDATION', 'Autenticación rechazada.'))),
      navegador(),
    ).execute(PETICION)

    expect(wallet.confirmRecharge).not.toHaveBeenCalled()
    expect(!result.ok && result.error.code).toBe('VALIDATION')
  })
})

describe('RechargeWallet · con PayPal', () => {
  it('abre la aprobación y captura el cobro al volver', async () => {
    const wallet = monedero({ startRecharge: jest.fn().mockResolvedValue(ok(CON_PAYPAL)) })
    const web = navegador()

    const result = await new RechargeWallet(wallet, banco(), web).execute({
      ...PETICION,
      method: 'PAYPAL',
    })

    expect(web.approve).toHaveBeenCalledWith('https://paypal.test/aprobar')
    expect(wallet.capturePayPal).toHaveBeenCalledWith('p-2')
    expect(result.ok && result.value).toBe('recharged')
  })

  /** Cerrar la pestaña no es un fallo: es alguien que ha decidido no pagar todavía. */
  it('salir sin pagar no es un error y no captura nada', async () => {
    const wallet = monedero({ startRecharge: jest.fn().mockResolvedValue(ok(CON_PAYPAL)) })

    const result = await new RechargeWallet(
      wallet,
      banco(),
      navegador(ok('cancelled')),
    ).execute({ ...PETICION, method: 'PAYPAL' })

    expect(result.ok && result.value).toBe('cancelled')
    expect(wallet.capturePayPal).not.toHaveBeenCalled()
  })

  it('propaga el fallo si el navegador no se puede abrir', async () => {
    const wallet = monedero({ startRecharge: jest.fn().mockResolvedValue(ok(CON_PAYPAL)) })

    const result = await new RechargeWallet(
      wallet,
      banco(),
      navegador(err(new AppError('UNKNOWN', 'No se ha podido abrir la pasarela.'))),
    ).execute({ ...PETICION, method: 'PAYPAL' })

    expect(!result.ok && result.error.code).toBe('UNKNOWN')
    expect(wallet.capturePayPal).not.toHaveBeenCalled()
  })
})

describe('RechargeWallet · lo que no debe pasar', () => {
  it('no llama a la pasarela con un importe de cero', async () => {
    const wallet = monedero()

    const result = await new RechargeWallet(wallet, banco(), navegador()).execute({
      ...PETICION,
      amount: 0,
    })

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(wallet.startRecharge).not.toHaveBeenCalled()
  })

  it('propaga el fallo de abrir la recarga', async () => {
    const result = await new RechargeWallet(
      monedero({
        startRecharge: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'caído'))),
      }),
      banco(),
      navegador(),
    ).execute(PETICION)

    expect(!result.ok && result.error.code).toBe('SERVER')
  })

  /**
   * Sin secreto ni enlace no hay nada que aprobar. Dar la recarga por buena aquí sería anunciar un
   * saldo que nadie ha cobrado.
   */
  it('no da por buena una recarga que la pasarela no sabe cómo continuar', async () => {
    const result = await new RechargeWallet(
      monedero({
        startRecharge: jest
          .fn()
          .mockResolvedValue(ok({ paymentId: 'p-3', status: 'PENDING', chargeFormatted: '$1' })),
      }),
      banco(),
      navegador(),
    ).execute(PETICION)

    expect(result.ok).toBe(false)
  })

  it('propaga el fallo al cerrar el cobro', async () => {
    const result = await new RechargeWallet(
      monedero({
        confirmRecharge: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'no cerrado'))),
      }),
      banco(),
      navegador(),
    ).execute(PETICION)

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})
