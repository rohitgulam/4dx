import {
  deleteWeeklyAccountabilityById,
  findWeeklyAccountabilityById
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

  const entry = await findWeeklyAccountabilityById(weeklyAccountabilityId)

  if (!entry || entry.wigId !== wigId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Weekly accountability not found'
    })
  }

  await deleteWeeklyAccountabilityById(weeklyAccountabilityId)

  return {
    success: true
  }
})
