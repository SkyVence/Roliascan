import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, PgSchema } from "drizzle-orm/pg-core";
import { chapter } from "./schema";

export const defineAuthTables = (schema: PgSchema<any>) => {
    const user = schema.table("user", {
        id: text('id').primaryKey(),
        name: text('name').notNull(),
        email: text('email').notNull().unique(),
        emailVerified: boolean('email_verified').notNull(),
        username: text('username').notNull().unique(),
        displayUsername: text('display_username').notNull(),
        image: text('image'),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull()
    });
    const userRelations = relations(user, ({ many }) => ({
        chapters: many(chapter),
    }));
    const session = schema.table("session", {
        id: text('id').primaryKey(),
        expiresAt: timestamp('expires_at').notNull(),
        token: text('token').notNull().unique(),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        activeOrganizationId: text('active_organization_id')
    });
    
    const account = schema.table("account", {
        id: text('id').primaryKey(),
        accountId: text('account_id').notNull(),
        providerId: text('provider_id').notNull(),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        idToken: text('id_token'),
        accessTokenExpiresAt: timestamp('access_token_expires_at'),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
        scope: text('scope'),
        password: text('password'),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull()
    });
    
    const verification = schema.table("verification", {
        id: text('id').primaryKey(),
        identifier: text('identifier').notNull(),
        value: text('value').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at')
    });
    const organization = schema.table("organization", {
        id: text('id').primaryKey(),
        name: text('name').notNull(),
        slug: text('slug').unique(),
        logo: text('logo'),
        createdAt: timestamp('created_at').notNull(),
        metadata: text('metadata')
    });

    const member = schema.table("member", {
        id: text('id').primaryKey(),
        organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        role: text('role').notNull(),
        createdAt: timestamp('created_at').notNull()
    });

    const invitation = schema.table("invitation", {
        id: text('id').primaryKey(),
        organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
        email: text('email').notNull(),
        role: text('role'),
        status: text('status').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' })
    });
    return { user, session, account, verification, userRelations, organization, member, invitation };
};
