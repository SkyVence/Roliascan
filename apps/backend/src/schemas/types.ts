export const ROLES = ["admin", "moderator", "uploader", "user"] as const;

export type UserRole = (typeof ROLES)[number]; 