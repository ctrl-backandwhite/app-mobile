import { ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { Text } from '@ds/components'

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
  onAddCard: () => void
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
      <Text variant="label" tone={selected ? 'primary' : 'default'}>
        {label}
      </Text>
      {hint ? <Text variant="caption" tone="muted" className="mt-0.5">{hint}</Text> : null}
      {children}
    </Pressable>
  )
}

/**
 * Formas de pago disponibles EN LA APLICACIÓN.
 *
 * No están todas las del escritorio y es a propósito: aprobar un pago en PayPal necesita pasos que
 * la app todavía no puede completar, y ofrecer un botón que termina en un pedido sin cobrar es peor
 * que no ofrecerlo. Se enseña, se explica y no se deja pulsar.
 */
export function PaymentPicker({
  methods,
  selection,
  wallet,
  walletEnough,
  loading = false,
  onSelect,
  onAddCard,
}: Props): ReactElement {
  const walletSelected = selection?.kind === 'WALLET'

  return (
    <View className="gap-2" testID="payment-picker">
      <Text variant="label">Método de pago</Text>

      {loading ? (
        <Text variant="caption" tone="muted" className="py-2">Cargando métodos…</Text>
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
          <Text accessibilityRole="alert"
      variant="caption" tone="error" className="mt-1">
            {CHECKOUT_MESSAGES.insufficientWallet}
          </Text>
        ) : null}
      </Option>

      <Option
        label="PayPal"
        hint={CHECKOUT_MESSAGES.paypalRedirect}
        selected={selection?.kind === 'PAYPAL'}
        onPress={(): void => onSelect({ kind: 'PAYPAL' })}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir una tarjeta"
        onPress={onAddCard}
        className="rounded-field border border-dashed border-base-300 p-3"
      >
        <Text variant="label" tone="primary">Añadir tarjeta</Text>
      </Pressable>
    </View>
  )
}
