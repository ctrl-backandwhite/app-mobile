import { Page } from '@features/catalog/domain/entities/page'
import { Review } from '@features/catalog/domain/entities/review'

import { ReviewDto, ReviewPageDto } from '../dto/catalog.dto'

export function toReview(dto: ReviewDto): Review {
  return {
    id: dto.id,
    rating: dto.rating,
    title: dto.title,
    body: dto.body,
    authorName: dto.authorName,
    createdAt: dto.createdAt,
  }
}

export function toReviewPage(dto: ReviewPageDto): Page<Review> {
  return {
    items: dto.items.map(toReview),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
