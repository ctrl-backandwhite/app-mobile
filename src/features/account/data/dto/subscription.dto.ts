import { z } from 'zod'

/** Solo lo que la app pinta: límites, posición y céntimos no se usan y no se validan. */
export const planDto = z.object({
  id: z.string(),
  code: z.string().default(''),
  name: z.string().default(''),
  description: z.string().nullish(),
  displayMonthlyFormatted: z.string().nullish(),
  displayYearlyFormatted: z.string().nullish(),
})

export const plansDto = z.array(planDto)

export const subscriptionDto = z.object({
  planId: z.string(),
  status: z.string().default(''),
  billingPeriod: z.string().default(''),
  currentPeriodEnd: z.string().nullish(),
  cancelAt: z.string().nullish(),
})

export type PlanDto = z.infer<typeof planDto>
export type SubscriptionDto = z.infer<typeof subscriptionDto>
