import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema";
import { uploadTeamsTable } from "./uploadTeams.schema";
import { teamRole } from "./enum.schema";

export const teamMembersTable = pgTable("team_members", {
    userId: uuid("userId").notNull().references(() => usersTable.id, { onDelete: 'cascade' }), // Cascade delete if user is deleted
    teamId: uuid("teamId").notNull().references(() => uploadTeamsTable.id, { onDelete: 'cascade' }), // Cascade delete if team is deleted
    role: teamRole("role").notNull().default("user"), // Default role is 'user'

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
}, (table) => {
    return {
        // Ensure a user can only have one role per team
        pk: primaryKey({ columns: [table.userId, table.teamId] }), 
    };
}); 