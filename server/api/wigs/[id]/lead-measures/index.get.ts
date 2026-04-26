import { findLeadMeasuresByWigId } from '@@/server/utils/lead-measure'
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

  const leadMeasures = await findLeadMeasuresByWigId(wigId)

  return {
    leadMeasures: leadMeasures.map((leadMeasure) => ({
      id: leadMeasure.id,
      wigId: leadMeasure.wigId,
      title: leadMeasure.title,
      description: leadMeasure.description,
      status: leadMeasure.status,
      scheduledDate: leadMeasure.scheduledDate.toISOString(),
      completedAt: leadMeasure.completedAt?.toISOString() ?? null,
      createdAt: leadMeasure.createdAt.toISOString(),
      updatedAt: leadMeasure.updatedAt.toISOString()
    }))
  }
})
