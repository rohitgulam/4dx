import { findWeeklyAccountabilityByWigId } from '@@/server/utils/weekly-accountability'
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

  const entries = await findWeeklyAccountabilityByWigId(wigId)

  return {
    weeklyAccountability: entries.map((entry) => ({
      id: entry.id,
      wigId: entry.wigId,
      weekStartDate: entry.weekStartDate.toISOString(),
      status: entry.status,
      summary: entry.summary,
      nextCommitment: entry.nextCommitment,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }))
  }
})
