import { asc, eq } from 'drizzle-orm'

import type { NewLeadMeasure } from '../database/schema'
import { leadMeasures } from '../database/schema'
import { useDrizzle } from './drizzle'

export type CreateLeadMeasureInput = {
  wigId: string
  title: string
  description?: string | null
  status: 'scheduled' | 'completed'
  scheduledDate: Date
}

export type UpdateLeadMeasureInput = {
  title?: string
  description?: string | null
  status?: 'scheduled' | 'completed'
  scheduledDate?: Date
}

export async function findLeadMeasuresByWigId(wigId: string) {
  return useDrizzle()
    .select()
    .from(leadMeasures)
    .where(eq(leadMeasures.wigId, wigId))
    .orderBy(asc(leadMeasures.scheduledDate), asc(leadMeasures.createdAt))
}

export async function findLeadMeasureById(id: string) {
  const [leadMeasure] = await useDrizzle()
    .select()
    .from(leadMeasures)
    .where(eq(leadMeasures.id, id))
    .limit(1)

  return leadMeasure ?? null
}

export async function createLeadMeasure(input: CreateLeadMeasureInput) {
  const [createdLeadMeasure] = await useDrizzle()
    .insert(leadMeasures)
    .values({
      wigId: input.wigId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      scheduledDate: input.scheduledDate,
      completedAt: input.status === 'completed' ? new Date() : null
    } satisfies NewLeadMeasure)
    .returning()

  return createdLeadMeasure ?? null
}

export async function updateLeadMeasureById(id: string, input: UpdateLeadMeasureInput) {
  const existingLeadMeasure = await findLeadMeasureById(id)

  if (!existingLeadMeasure) {
    return null
  }

  const nextStatus = input.status ?? existingLeadMeasure.status
  const completedAt =
    nextStatus === 'completed'
      ? existingLeadMeasure.completedAt ?? new Date()
      : null

  const [updatedLeadMeasure] = await useDrizzle()
    .update(leadMeasures)
    .set({
      title: input.title,
      description: input.description,
      status: nextStatus,
      scheduledDate: input.scheduledDate,
      completedAt,
      updatedAt: new Date()
    })
    .where(eq(leadMeasures.id, id))
    .returning()

  return updatedLeadMeasure ?? null
}
