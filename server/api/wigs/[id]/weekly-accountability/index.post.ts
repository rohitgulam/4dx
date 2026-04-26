import { z } from 'zod'

import { createWeeklyAccountability } from '@@/server/utils/weekly-accountability'
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
    weekStartDate: z.string().date(),
    status: z.enum(['winning', 'at-risk', 'behind']),
    summary: z.string().trim().min(1, 'Summary is required'),
    nextCommitment: z.string().trim().optional().nullable()
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

  const entry = await createWeeklyAccountability({
    wigId,
    weekStartDate: new Date(`${parsed.data.weekStartDate}T00:00:00.000Z`),
    status: parsed.data.status,
    summary: parsed.data.summary,
    nextCommitment: parsed.data.nextCommitment ?? null
  })

  if (!entry) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create weekly accountability'
    })
  }

  return {
    weeklyAccountability: {
      id: entry.id,
      wigId: entry.wigId,
      weekStartDate: entry.weekStartDate.toISOString(),
      status: entry.status,
      summary: entry.summary,
      nextCommitment: entry.nextCommitment,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }
  }
})
