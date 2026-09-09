import { num, text } from '@core/data/nullable'
import { Category } from '@features/catalog/domain/entities/category'

import { CategoryDto } from '../dto/catalog.dto'

/**
 * Traduce la categoría y su rama. El `null` con el que el backend marca los nodos raíz se convierte
 * en ausencia de valor para que el dominio tenga una sola forma de decir «no tiene padre».
 */
export function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    parentId: dto.parentId ?? undefined,
    position: dto.position,
    icon: text(dto.icon),
    directProductCount: num(dto.directProductCount),
    children: dto.children?.map(toCategory),
  }
}
