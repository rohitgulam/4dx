import { z } from 'zod'

import { createLeadMeasure } from '@@/server/utils/lead-measure'
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

  if (!wigId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'WIG id is required'
    })
  }

  const schema = z.object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().optional().nullable(),
    status: z.enum(['scheduled', 'completed']),
    scheduledDate: z.string().date()
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

  const createdLeadMeasure = await createLeadMeasure({
    wigId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    scheduledDate: new Date(`${parsed.data.scheduledDate}T00:00:00.000Z`)
  })

  if (!createdLeadMeasure) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create lead measure'
    })
  }

  return {
    leadMeasure: {
      id: createdLeadMeasure.id,
      wigId: createdLeadMeasure.wigId,
      title: createdLeadMeasure.title,
      description: createdLeadMeasure.description,
      status: createdLeadMeasure.status,
      scheduledDate: createdLeadMeasure.scheduledDate.toISOString(),
      completedAt: createdLeadMeasure.completedAt?.toISOString() ?? null,
      createdAt: createdLeadMeasure.createdAt.toISOString(),
      updatedAt: createdLeadMeasure.updatedAt.toISOString()
    }
  }
})
