import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from '@ds/components'

import { Review } from '@features/catalog/domain/entities/review'

interface Props {
  reviews: readonly Review[]
  /** Total de opiniones del producto, que puede ser mayor que las traídas en esta página. */
  total: number
}

const STAR_POSITIONS: readonly number[] = [0, 1, 2, 3, 4]

/**
 * Estrella dibujada con vistas, igual que en la tarjeta del catálogo: no hay familia de iconos
 * instalada y un emoji rompería el trazo del escritorio.
 */
function StarMark({ filled }: { filled: boolean }): ReactElement {
  const tone = filled ? 'bg-accent' : 'bg-base-300'

  return (
    <View className="h-3 w-3 items-center justify-center">
      <View className={`absolute h-2 w-2 ${tone}`} />
      <View className={`absolute h-2 w-2 rotate-45 ${tone}`} />
    </View>
  )
}

function Stars({ rating }: { rating: number }): ReactElement {
  return (
    <View accessibilityLabel={`${rating} de 5 estrellas`} className="flex-row gap-0.5">
      {STAR_POSITIONS.map((position: number): ReactElement => (
        <StarMark key={position} filled={position < Math.round(rating)} />
      ))}
    </View>
  )
}

/**
 * Fecha del día tal y como la manda el backend, sin tocar la hora ni la zona: pasar el ISO por un
 * `Date` local adelanta o atrasa el día cerca de medianoche, y la opinión aparecería fechada mal.
 */
function dayOf(createdAt: string): string {
  const [year, month, day] = createdAt.slice(0, 10).split('-')
  return day && month && year ? `${day}/${month}/${year}` : createdAt
}

export function ReviewList({ reviews, total }: Props): ReactElement {
  if (reviews.length === 0) {
    return (
      <Text variant="label" tone="muted">Todavía no hay opiniones.</Text>
    )
  }

  return (
    <View className="gap-3">
      <Text variant="caption" tone="muted">
        {total === 1 ? '1 opinión' : `${total} opiniones`}
      </Text>

      {reviews.map((review: Review): ReactElement => (
        <View
          key={review.id}
          testID={`review-${review.id}`}
          className="gap-1.5 rounded-box border border-base-300 bg-base-100 p-3.5"
        >
          <View className="flex-row items-center gap-2">
            <Stars rating={review.rating} />
            {review.authorName ? (
              <Text variant="caption" tone="muted">{review.authorName}</Text>
            ) : null}
            {review.createdAt ? (
              <Text variant="caption" tone="muted">
                {dayOf(review.createdAt)}
              </Text>
            ) : null}
          </View>

          {review.title ? (
            <Text variant="label">{review.title}</Text>
          ) : null}
          {review.body ? (
            <Text variant="label" className="leading-[19px]">{review.body}</Text>
          ) : null}
        </View>
      ))}
    </View>
  )
}
