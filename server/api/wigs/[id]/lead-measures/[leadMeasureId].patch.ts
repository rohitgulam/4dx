import { z } from 'zod'

import { findLeadMeasureById, updateLeadMeasureById } from '@@/server/utils/lead-measure'
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
  const leadMeasureId = getRouterParam(event, 'leadMeasureId')

  if (!wigId || !leadMeasureId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lead measure id is required'
    })
  }

  const schema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional().nullable(),
    status: z.enum(['scheduled', 'completed']).optional(),
    scheduledDate: z.string().date().optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid lead measure payload'
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

  const existingLeadMeasure = await findLeadMeasureById(leadMeasureId)

  if (!existingLeadMeasure || existingLeadMeasure.wigId !== wigId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lead measure not found'
    })
  }

  const updatedLeadMeasure = await updateLeadMeasureById(leadMeasureId, {
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    scheduledDate: parsed.data.scheduledDate
      ? new Date(`${parsed.data.scheduledDate}T00:00:00.000Z`)
      : undefined
  })

  if (!updatedLeadMeasure) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update lead measure'
    })
  }

  return {
    leadMeasure: {
      id: updatedLeadMeasure.id,
      wigId: updatedLeadMeasure.wigId,
      title: updatedLeadMeasure.title,
      description: updatedLeadMeasure.description,
      status: updatedLeadMeasure.status,
      scheduledDate: updatedLeadMeasure.scheduledDate.toISOString(),
      completedAt: updatedLeadMeasure.completedAt?.toISOString() ?? null,
      createdAt: updatedLeadMeasure.createdAt.toISOString(),
      updatedAt: updatedLeadMeasure.updatedAt.toISOString()
    }
  }
})
