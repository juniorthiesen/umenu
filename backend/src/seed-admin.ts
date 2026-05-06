import bcrypt from "bcryptjs";
import { UserRole } from "../generated/prisma/enums";
import { prisma } from "./db";

const name = process.env.ADMIN_NAME || "Admin UMenu";
const email = process.env.ADMIN_EMAIL || "admin@umenu.local";
const password = process.env.ADMIN_PASSWORD || "change-me-admin-password";

if (password.length < 8) {
  throw new Error("ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.");
}

const passwordHash = await bcrypt.hash(password, 12);

const user = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  update: {
    name,
    passwordHash,
    role: UserRole.PLATFORM_ADMIN
  },
  create: {
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: UserRole.PLATFORM_ADMIN
  },
  select: {
    id: true,
    name: true,
    email: true,
    role: true
  }
});

console.log(`Admin criado/atualizado: ${user.email} (${user.role})`);

await prisma.$disconnect();
