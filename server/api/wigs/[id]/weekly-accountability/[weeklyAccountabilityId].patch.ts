import { z } from 'zod'

import {
  findWeeklyAccountabilityById,
  updateWeeklyAccountabilityById
} from '@@/server/utils/weekly-accountability'
import { findWigById } from '@@/server/utils/wig'
import { findPrimaryWorkspaceForUser } from '@@/server/utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const wigId = getRouterParam(event, 'id')
  const weeklyAccountabilityId = getRouterParam(event, 'weeklyAccountabilityId')

  if (!wigId || !weeklyAccountabilityId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Weekly accountability id is required'
    })
  }

  const schema = z.object({
    weekStartDate: z.string().date().optional(),
    status: z.enum(['winning', 'at-risk', 'behind']).optional(),
    summary: z.string().trim().min(1).optional(),
    nextCommitment: z.string().trim().optional().nullable()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid weekly accountability payload'
    })
  }

  const workspace = await findPrimaryWorkspaceForUser(userId)

  if (!workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workspace not found'
    })
  }

  const wig = await findWigById(wigId)

  if (!wig || wig.workspaceId !== workspace.id) {
    throw createError({
      statusCode: 404,
      statusMessage: 'WIG not found'
    })
  }

  const existingEntry = await findWeeklyAccountabilityById(weeklyAccountabilityId)

  if (!existingEntry || existingEntry.wigId !== wigId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Weekly accountability not found'
    })
  }

  const updatedEntry = await updateWeeklyAccountabilityById(weeklyAccountabilityId, {
    weekStartDate: parsed.data.weekStartDate
      ? new Date(`${parsed.data.weekStartDate}T00:00:00.000Z`)
      : undefined,
    status: parsed.data.status,
    summary: parsed.data.summary,
    nextCommitment: parsed.data.nextCommitment
  })

  if (!updatedEntry) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update weekly accountability'
    })
  }

  return {
    weeklyAccountability: {
      id: updatedEntry.id,
      wigId: updatedEntry.wigId,
      weekStartDate: updatedEntry.weekStartDate.toISOString(),
      status: updatedEntry.status,
      summary: updatedEntry.summary,
      nextCommitment: updatedEntry.nextCommitment,
      createdAt: updatedEntry.createdAt.toISOString(),
      updatedAt: updatedEntry.updatedAt.toISOString()
    }
  }
})
