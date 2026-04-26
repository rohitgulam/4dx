import { desc, eq } from 'drizzle-orm'

import type { NewWig } from '../database/schema'
import { wigs } from '../database/schema'
import { useDrizzle } from './drizzle'

export type CreateWigInput = {
  workspaceId: string
  createdByUserId: string
  title: string
  description?: string | null
  unit: string
  startValue: number
  currentValue: number
  targetValue: number
  deadline: Date
  completedAt?: Date | null
}

export type UpdateWigInput = {
  title?: string
  description?: string | null
  unit?: string
  startValue?: number
  currentValue?: number
  targetValue?: number
  deadline?: Date
  completedAt?: Date | null
}

export async function createWig(input: CreateWigInput) {
  const [createdWig] = await useDrizzle()
    .insert(wigs)
    .values({
      workspaceId: input.workspaceId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      description: input.description ?? null,
      unit: input.unit,
      startValue: input.startValue,
      currentValue: input.currentValue,
      targetValue: input.targetValue,
      deadline: input.deadline,
      completedAt: input.completedAt ?? null
    } satisfies NewWig)
    .returning()

  return createdWig
}

export async function findLatestWigByWorkspaceId(workspaceId: string) {
  const [wig] = await useDrizzle()
    .select()
    .from(wigs)
    .where(eq(wigs.workspaceId, workspaceId))
    .orderBy(desc(wigs.createdAt))
    .limit(1)

  return wig ?? null
}

export async function findWigsByWorkspaceId(workspaceId: string) {
  return useDrizzle()
    .select()
    .from(wigs)
    .where(eq(wigs.workspaceId, workspaceId))
    .orderBy(desc(wigs.createdAt))
}

export async function findWigById(id: string) {
  const [wig] = await useDrizzle()
    .select()
    .from(wigs)
    .where(eq(wigs.id, id))
    .limit(1)

  return wig ?? null
}

export async function updateWigById(id: string, input: UpdateWigInput) {
  const [updatedWig] = await useDrizzle()
    .update(wigs)
    .set({
      ...input,
      updatedAt: new Date()
    })
    .where(eq(wigs.id, id))
    .returning()

  return updatedWig ?? null
}

export async function deleteWigById(id: string) {
  const [deletedWig] = await useDrizzle()
    .delete(wigs)
    .where(eq(wigs.id, id))
    .returning()

  return deletedWig ?? null
}
