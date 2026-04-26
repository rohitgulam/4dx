import { z } from 'zod'

import { findWigById, updateWigById } from '@@/server/utils/wig'
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

  if (!wigId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'WIG id is required'
    })
  }

  const schema = z.object({
    title: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).optional(),
    startValue: z.number().int().optional(),
    currentValue: z.number().int().optional(),
    targetValue: z.number().int().optional(),
    deadline: z.string().date().optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid WIG payload'
    })
  }

  const workspace = await findPrimaryWorkspaceForUser(userId)

  if (!workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workspace not found'
    })
  }

  const existingWig = await findWigById(wigId)

  if (!existingWig || existingWig.workspaceId !== workspace.id) {
    throw createError({
      statusCode: 404,
      statusMessage: 'WIG not found'
    })
  }

  const updatedWig = await updateWigById(wigId, {
    title: parsed.data.title,
    unit: parsed.data.unit,
    startValue: parsed.data.startValue,
    currentValue: parsed.data.currentValue,
    targetValue: parsed.data.targetValue,
    deadline: parsed.data.deadline ? new Date(`${parsed.data.deadline}T00:00:00.000Z`) : undefined
  })

  if (!updatedWig) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update WIG'
    })
  }

  return {
    wig: {
      id: updatedWig.id,
      title: updatedWig.title,
      unit: updatedWig.unit,
      startValue: updatedWig.startValue,
      currentValue: updatedWig.currentValue,
      targetValue: updatedWig.targetValue,
      deadline: updatedWig.deadline.toISOString(),
      workspaceId: updatedWig.workspaceId,
      createdByUserId: updatedWig.createdByUserId,
      createdAt: updatedWig.createdAt.toISOString(),
      updatedAt: updatedWig.updatedAt.toISOString()
    }
  }
})
