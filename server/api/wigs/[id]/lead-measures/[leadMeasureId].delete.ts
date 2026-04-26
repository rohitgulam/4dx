import { deleteLeadMeasureById, findLeadMeasureById } from '@@/server/utils/lead-measure'
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

  const leadMeasure = await findLeadMeasureById(leadMeasureId)

  if (!leadMeasure || leadMeasure.wigId !== wigId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lead measure not found'
    })
  }

  await deleteLeadMeasureById(leadMeasureId)

  return {
    success: true
  }
})
