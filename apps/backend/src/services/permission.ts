import { db } from "../db"
import { permissions, userPermissions } from "@/schemas/index"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import { config } from "../config"

/**
 * Check if a user has a specific permission
 * @param userId User ID
 * @param role User role
 * @param permissionName Permission name to check
 * @returns Boolean indicating if user has permission
 */
export async function checkPermission(userId: string, role: string, permissionName: string): Promise<boolean> {
  // Admin has all permissions
  if (role === config.roles.admin) {
    return true
  }

  // Check role-based permissions
  if (role && config.rolePermissions[role]?.includes(permissionName)) {
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

/**
 * Create a new permission
 * @param name Permission name
 * @param description Permission description
 * @returns Created permission
 */
export async function createPermission(name: string, description?: string) {
  // Check if permission already exists
  const existingPermission = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1)
  if (existingPermission.length > 0) {
    throw new Error("Permission already exists")
  }

  // Create permission
  const permissionId = uuidv4()
  await db.insert(permissions).values({
    id: permissionId,
    name,
    description,
  })

  return { id: permissionId, name, description }
}

/**
 * Assign permission to user
 * @param userId User ID
 * @param permissionId Permission ID
 * @returns Boolean indicating success
 */
export async function assignPermission(userId: string, permissionId: string) {
  // Check if user already has this permission
  const existingUserPermission = await db
    .select()
    .from(userPermissions)
    .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, permissionId)))
    .limit(1)

  if (existingUserPermission.length > 0) {
    throw new Error("User already has this permission")
  }

  // Assign permission to user
  await db.insert(userPermissions).values({
    userId,
    permissionId,
  })

  return true
}

/**
 * Remove permission from user
 * @param userId User ID
 * @param permissionId Permission ID
 * @returns Boolean indicating success
 */
export async function removePermission(userId: string, permissionId: string) {
  // Remove permission from user
  const result = await db
    .delete(userPermissions)
    .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, permissionId)))

  return result.rowCount > 0
}

/**
 * Get all permissions
 * @returns Array of permissions
 */
export async function getAllPermissions() {
  return db.select().from(permissions)
}

/**
 * Get user permissions
 * @param userId User ID
 * @returns Array of permissions
 */
export async function getUserPermissions(userId: string) {
  return db
    .select({
      id: permissions.id,
      name: permissions.name,
      description: permissions.description,
    })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId))
}
