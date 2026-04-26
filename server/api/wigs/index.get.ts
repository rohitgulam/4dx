import { findWigsByWorkspaceId } from '@@/server/utils/wig'
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

  const workspace = await findPrimaryWorkspaceForUser(userId)

  if (!workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workspace not found'
    })
  }

  const wigs = await findWigsByWorkspaceId(workspace.id)

  return {
    wigs: wigs.map((wig) => ({
      id: wig.id,
      title: wig.title,
      unit: wig.unit,
      startValue: wig.startValue,
      currentValue: wig.currentValue,
      targetValue: wig.targetValue,
      deadline: wig.deadline.toISOString(),
      completedAt: wig.completedAt?.toISOString() ?? null,
      workspaceId: wig.workspaceId,
      createdByUserId: wig.createdByUserId,
      createdAt: wig.createdAt.toISOString(),
      updatedAt: wig.updatedAt.toISOString()
    }))
  }
})
