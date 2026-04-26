import { z } from 'zod'

import { findPrimaryWorkspaceForUser } from '@@/server/utils/workspace'
import { createWig } from '@@/server/utils/wig'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const schema = z.object({
    title: z.string().trim().min(1, 'Title is required'),
    unit: z.string().trim().min(1, 'Unit is required'),
    startValue: z.number().int(),
    currentValue: z.number().int(),
    targetValue: z.number().int(),
    deadline: z.string().date()
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

  const createdWig = await createWig({
    workspaceId: workspace.id,
    createdByUserId: userId,
    title: parsed.data.title,
    unit: parsed.data.unit,
    startValue: parsed.data.startValue,
    currentValue: parsed.data.currentValue,
    targetValue: parsed.data.targetValue,
    deadline: new Date(`${parsed.data.deadline}T00:00:00.000Z`)
  })

  if (!createdWig) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create WIG'
    })
  }

  return {
    wig: {
      id: createdWig.id,
      title: createdWig.title,
      unit: createdWig.unit,
      startValue: createdWig.startValue,
      currentValue: createdWig.currentValue,
      targetValue: createdWig.targetValue,
      deadline: createdWig.deadline.toISOString(),
      completedAt: createdWig.completedAt?.toISOString() ?? null,
      workspaceId: createdWig.workspaceId,
      createdByUserId: createdWig.createdByUserId,
      createdAt: createdWig.createdAt.toISOString(),
      updatedAt: createdWig.updatedAt.toISOString()
    }
  }
})
