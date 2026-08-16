import { ReactElement } from 'react'

import { EmptyState } from '@features/catalog/presentation/components/EmptyState'

interface Props {
  onBrowseCatalog: () => void
}

/**
 * Cesta sin líneas. Reutiliza el hueco del catálogo para que el vacío se vea igual en toda la app;
 * lo único propio es el texto y que la salida lleve siempre al catálogo.
 */
export function CartEmptyState({ onBrowseCatalog }: Props): ReactElement {
  return (
    <EmptyState
      title="Tu cesta está vacía"
      message="Añade productos desde el catálogo y los verás aquí."
      actionLabel="Ver el catálogo"
      onAction={onBrowseCatalog}
    />
  )
}
