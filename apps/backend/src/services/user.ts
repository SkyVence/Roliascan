import { eq } from "drizzle-orm";
import { db } from "@/modules/db/db";
import { users } from "@/schemas/index";
import { hashPassword } from "@/services/password";
import { User } from "@/@types";


export async function getUserById(id: string) {
    return db.query.users.findFirst({
        where: eq(users.id, id)
    })
}

export async function getUserByEmail(email: string) {
    return db.query.users.findFirst({
        where: eq(users.email, email)
    })
}

export async function createUser(email: string, password: string) {
    const hashed_password = await hashPassword(password);
    return db.insert(users).values({
        email,
        password: hashed_password,
        username: email.split('@')[0]
    })
}

export async function updateUser(id: string, data: Partial<User>) {
    return db.update(users).set(data).where(eq(users.id, id));
}
