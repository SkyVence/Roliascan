import bcrypt from "bcrypt";

export async function hashPassword(plain_password: string) {
    const hashed_password = await bcrypt.hash(plain_password, 10);
    return hashed_password; 
}

export async function verifyPassword(plain_password: string, hashed_password: string) {
    return await bcrypt.compare(plain_password, hashed_password);
}