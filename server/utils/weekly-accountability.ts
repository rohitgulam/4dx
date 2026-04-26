import { asc, eq } from 'drizzle-orm'

import type { NewWeeklyAccountability } from '../database/schema'
import { weeklyAccountability } from '../database/schema'
import { useDrizzle } from './drizzle'

export type WeeklyAccountabilityStatus = 'winning' | 'at-risk' | 'behind'

export type CreateWeeklyAccountabilityInput = {
  wigId: string
  weekStartDate: Date
  status: WeeklyAccountabilityStatus
  summary: string
  nextCommitment?: string | null
}

export type UpdateWeeklyAccountabilityInput = {
  weekStartDate?: Date
  status?: WeeklyAccountabilityStatus
  summary?: string
  nextCommitment?: string | null
}

export async function findWeeklyAccountabilityByWigId(wigId: string) {
  return useDrizzle()
    .select()
    .from(weeklyAccountability)
    .where(eq(weeklyAccountability.wigId, wigId))
    .orderBy(asc(weeklyAccountability.weekStartDate))
}

export async function findWeeklyAccountabilityById(id: string) {
  const [entry] = await useDrizzle()
    .select()
    .from(weeklyAccountability)
    .where(eq(weeklyAccountability.id, id))
    .limit(1)

  return entry ?? null
}

export async function createWeeklyAccountability(input: CreateWeeklyAccountabilityInput) {
  const [entry] = await useDrizzle()
    .insert(weeklyAccountability)
    .values({
      wigId: input.wigId,
      weekStartDate: input.weekStartDate,
      status: input.status,
      summary: input.summary,
      nextCommitment: input.nextCommitment ?? null
    } satisfies NewWeeklyAccountability)
    .returning()

  return entry ?? null
}

export async function updateWeeklyAccountabilityById(
  id: string,
  input: UpdateWeeklyAccountabilityInput
) {
  const [entry] = await useDrizzle()
    .update(weeklyAccountability)
    .set({
      weekStartDate: input.weekStartDate,
      status: input.status,
      summary: input.summary,
      nextCommitment: input.nextCommitment,
      updatedAt: new Date()
    })
    .where(eq(weeklyAccountability.id, id))
    .returning()

  return entry ?? null
}

export async function deleteWeeklyAccountabilityById(id: string) {
  const [entry] = await useDrizzle()
    .delete(weeklyAccountability)
    .where(eq(weeklyAccountability.id, id))
    .returning()

  return entry ?? null
}
