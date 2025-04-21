import { db } from "../db"
import { users, userPermissions, permissions } from "@/schemas/index"
import { eq, and } from "drizzle-orm"
import { hashPassword } from "./password"
import { v4 as uuidv4 } from "uuid"

interface CreateUserParams {
  email: string
  username: string
  password: string
  role?: string
}

interface UpdateUserParams {
  username?: string
  email?: string
  password?: string
  role?: string
  isBanned?: boolean
  isMuted?: boolean
}

/**
 * Create a new user
 * @param params User creation parameters
 * @returns Created user
 */
export async function createUser(params: CreateUserParams) {
  const { email, username, password, role = "user" } = params

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const userId = uuidv4()
  await db.insert(users).values({
    id: userId,
    email,
    username,
    password: hashedPassword,
    role,
  })

  // Return user without password
  return {
    id: userId,
    email,
    username,
    role,
  }
}

/**
 * Find a user by email
 * @param email User email
 * @returns User or null if not found
 */
export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result.length > 0 ? result[0] : null
}

/**
 * Find a user by ID
 * @param id User ID
 * @returns User or null if not found
 */
export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result.length > 0 ? result[0] : null
}

/**
 * Update a user
 * @param id User ID
 * @param params Update parameters
 * @returns Updated user
 */
export async function updateUser(id: string, params: UpdateUserParams) {
  const updateData: any = { ...params }

  // Hash password if provided
  if (params.password) {
    updateData.password = await hashPassword(params.password)
  }

  // Update user
  await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id))

  // Get updated user
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result.length > 0 ? result[0] : null
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

/**
 * Check if username is taken
 * @param username Username to check
 * @param excludeUserId User ID to exclude from check
 * @returns Boolean indicating if username is taken
 */
export async function isUsernameTaken(username: string, excludeUserId?: string) {
  const query = db.select().from(users).where(eq(users.username, username))

  if (excludeUserId) {
    query.where(and(eq(users.username, username), sql`${users.id} != ${excludeUserId}`))
  }

  const result = await query.limit(1)
  return result.length > 0
}

/**
 * Check if email is taken
 * @param email Email to check
 * @param excludeUserId User ID to exclude from check
 * @returns Boolean indicating if email is taken
 */
export async function isEmailTaken(email: string, excludeUserId?: string) {
  const query = db.select().from(users).where(eq(users.email, email))

  if (excludeUserId) {
    query.where(and(eq(users.email, email), sql`${users.id} != ${excludeUserId}`))
  }

  const result = await query.limit(1)
  return result.length > 0
}

// Missing import
import { sql } from "drizzle-orm"
