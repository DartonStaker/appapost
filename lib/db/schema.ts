import { pgTable, text, timestamp, boolean, integer, jsonb, varchar, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const postStatusEnum = pgEnum("post_status", ["draft", "scheduled", "posted", "failed"])
export const contentTypeEnum = pgEnum("content_type", ["product", "blog"])
export const platformEnum = pgEnum("platform", ["instagram", "facebook", "twitter", "linkedin", "tiktok", "pinterest"])

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
})

export const socialAccounts = pgTable("social_accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  accountName: text("account_name").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  autoPost: boolean("auto_post").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const posts = pgTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  imageUrl: text("image_url"),
  productUrl: text("product_url"),
  contentType: contentTypeEnum("content_type").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  status: postStatusEnum("status").default("draft").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const postVariations = pgTable("post_variations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  content: text("content").notNull(),
  hashtags: jsonb("hashtags").$type<string[]>(),
  isSelected: boolean("is_selected").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const scheduledPosts = pgTable("scheduled_posts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  variationId: text("variation_id").notNull().references(() => postVariations.id, { onDelete: "cascade" }),
  socialAccountId: text("social_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  postedAt: timestamp("posted_at"),
  status: postStatusEnum("status").default("scheduled").notNull(),
  postUrl: text("post_url"),
  engagement: jsonb("engagement").$type<{ likes?: number; comments?: number; shares?: number }>(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const templates = pgTable("templates", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const brandSettings = pgTable("brand_settings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  brandVoice: text("brand_voice"),
  defaultHashtags: jsonb("default_hashtags").$type<string[]>(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

