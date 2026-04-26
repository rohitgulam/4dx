import {
  boolean,
  integer,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const authProviders = pgEnum('auth_providers', ['email', 'google'])

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProviders('provider').notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (authAccounts) => [
    unique().on(authAccounts.userId, authAccounts.provider),
    unique().on(authAccounts.provider, authAccounts.providerUserId),
  ]
).enableRLS()

export const workspaces = pgTable('workspaces', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', ['admin', 'member'])

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceMemberRoleEnum().notNull().default('member'),
    isOwner: boolean('is_owner').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index('workspace_members_user_id_idx').on(table.userId),
  ]
)

export const wigs = pgTable(
  'wigs',
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    unit: text().notNull(),
    startValue: integer('start_value').notNull(),
    currentValue: integer('current_value').notNull(),
    targetValue: integer('target_value').notNull(),
    deadline: timestamp('deadline', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('wigs_workspace_id_idx').on(table.workspaceId),
    index('wigs_created_by_user_id_idx').on(table.createdByUserId)
  ]
)

export const leadMeasureStatusEnum = pgEnum('lead_measure_status', ['scheduled', 'completed'])

export const leadMeasures = pgTable(
  'lead_measures',
  {
    id: uuid().defaultRandom().primaryKey(),
    wigId: uuid('wig_id')
      .notNull()
      .references(() => wigs.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    description: text(),
    status: leadMeasureStatusEnum('status').notNull().default('scheduled'),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('lead_measures_wig_id_idx').on(table.wigId),
    index('lead_measures_status_idx').on(table.status)
  ]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert

export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert

export type AuthAccount = typeof authAccounts.$inferSelect
export type NewAuthAccount = typeof authAccounts.$inferInsert

export type Wig = typeof wigs.$inferSelect
export type NewWig = typeof wigs.$inferInsert

export type LeadMeasure = typeof leadMeasures.$inferSelect
export type NewLeadMeasure = typeof leadMeasures.$inferInsert
