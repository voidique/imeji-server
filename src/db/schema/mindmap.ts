import { relations } from 'drizzle-orm'
import {
  type AnyPgColumn,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

export const masteryLevel = pgEnum('mastery_level', ['unknown', 'learning', 'known'])

export const mindmap = pgTable(
  'mindmap',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updated_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index('mindmap_user_id_idx').on(t.userId)],
)

export const concept = pgTable(
  'concept',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mapId: uuid('map_id')
      .notNull()
      .references(() => mindmap.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => concept.id, {
      onDelete: 'cascade',
    }),
    label: text('label').notNull(),
    detail: text('detail'),
    mastery: masteryLevel('mastery').default('learning').notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updated_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index('concept_map_parent_position_idx').on(t.mapId, t.parentId, t.position)],
)

export const mindmapRelations = relations(mindmap, ({ one, many }) => ({
  user: one(user, { fields: [mindmap.userId], references: [user.id] }),
  concepts: many(concept),
}))

export const conceptRelations = relations(concept, ({ one, many }) => ({
  map: one(mindmap, { fields: [concept.mapId], references: [mindmap.id] }),
  parent: one(concept, {
    fields: [concept.parentId],
    references: [concept.id],
    relationName: 'concept_parent',
  }),
  children: many(concept, { relationName: 'concept_parent' }),
}))

export type Mindmap = typeof mindmap.$inferSelect
export type NewMindmap = typeof mindmap.$inferInsert
export type Concept = typeof concept.$inferSelect
export type NewConcept = typeof concept.$inferInsert
