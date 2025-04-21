import { db } from "../db"
import { userPermissions, permissions } from "@/schemas/index"
import { eq, and } from "drizzle-orm"

// Role-based permissions
const rolePermissions = {
  admin: ["*"], // Admin can do everything
  moderator: ["create:content", "update:content", "create:chapter", "update:chapter", "delete:comment", "mute:user"],
  uploader: ["create:content", "update:content", "create:chapter", "update:chapter"],
  user: [], // Regular users have no special permissions
}

/**
 * Check if a user has a specific permission
 * @param userId User ID
 * @param role User role
 * @param permissionName Permission name to check
 * @returns Boolean indicating if user has permission
 */
export async function checkPermission(userId: string, role: string, permissionName: string): Promise<boolean> {
  // Admin has all permissions
  if (role === "admin") {
    return true
  }

  // Check role-based permissions
  if (role && rolePermissions[role]?.includes(permissionName)) {
    return true
  }

  // Check user-specific permissions
  const userPerms = await db
    .select()
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(and(eq(userPermissions.userId, userId), eq(permissions.name, permissionName)))
    .limit(1)

  return userPerms.length > 0
}
