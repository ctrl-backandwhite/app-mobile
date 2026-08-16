import { ReactElement, ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import {
  expiryLabel,
  PaymentMethod,
  paymentLabel,
  PaymentSelection,
  selectionFor,
} from '@features/checkout/domain/entities/payment-method'
import { CHECKOUT_MESSAGES } from '@features/checkout/domain/policies/checkout-errors'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'

interface Props {
  methods: readonly PaymentMethod[]
  selection?: PaymentSelection
  wallet?: WalletBalance
  /** Falso solo cuando se sabe que el saldo no cubre el pedido. */
  walletEnough: boolean
  loading?: boolean
  onSelect: (selection: PaymentSelection) => void
}

function Option({
  label,
  hint,
  selected,
  disabled = false,
  onPress,
  children,
}: {
  label: string
  hint?: string
  selected: boolean
  disabled?: boolean
  onPress: () => void
  children?: ReactNode
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Pagar con ${label}`}
      accessibilityState={{ selected, checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`rounded-field border p-3 ${
        selected ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-100'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <Text className={`text-[13px] ${selected ? 'font-medium text-primary' : 'text-base-content'}`}>
        {label}
      </Text>
      {hint ? <Text className="mt-0.5 text-[11px] text-base-content opacity-60">{hint}</Text> : null}
      {children}
    </Pressable>
  )
}

/**
 * Formas de pago disponibles EN LA APLICACIÓN.
 *
 * No están todas las del escritorio y es a propósito: dar de alta una tarjeta nueva y aprobar un
 * pago en PayPal necesitan pasos que la app todavía no puede completar, y ofrecer un botón que
 * termina en un pedido sin cobrar es peor que no ofrecerlo. Se enseñan, se explican y no se dejan
 * pulsar.
 */
export function PaymentPicker({
  methods,
  selection,
  wallet,
  walletEnough,
  loading = false,
  onSelect,
}: Props): ReactElement {
  const walletSelected = selection?.kind === 'WALLET'

  return (
    <View className="gap-2" testID="payment-picker">
      <Text className="text-[13px] font-medium text-base-content">Método de pago</Text>

      {loading ? (
        <Text className="py-2 text-[12px] text-base-content opacity-60">Cargando métodos…</Text>
      ) : null}

      {methods.map((method) => (
        <Option
          key={method.id}
          label={paymentLabel(method)}
          hint={expiryLabel(method) ? `Caduca ${expiryLabel(method)}` : undefined}
          selected={selection?.savedMethodId === method.id}
          onPress={(): void => onSelect(selectionFor(method))}
        />
      ))}

      <Option
        label="Monedero"
        hint={wallet ? `Saldo disponible: ${wallet.balanceFormatted ?? '—'}` : 'Consultando saldo…'}
        selected={walletSelected}
        onPress={(): void => onSelect({ kind: 'WALLET' })}
      >
        {!walletEnough ? (
          <Text
            accessibilityRole="alert"
            className="mt-1 text-[11px] text-warning"
          >
            {CHECKOUT_MESSAGES.insufficientWallet}
          </Text>
        ) : null}
      </Option>

      <Option
        label="PayPal"
        hint={CHECKOUT_MESSAGES.paypalUnavailable}
        selected={false}
        disabled
        onPress={(): void => undefined}
      />
    </View>
  )
}
