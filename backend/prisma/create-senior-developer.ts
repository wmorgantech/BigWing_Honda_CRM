import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// One-shot script to upsert the senior developer account used by the
// Truncate-All-Data button on the Import page. Idempotent — rerun safely.
//
// Run with:  npx tsx backend/prisma/create-senior-developer.ts
//            (or: npm run -w @bigwing/db -- exec tsx ../prisma/create-senior-developer.ts)

const USERNAME = "developer";
const FULL_NAME = "Senior Developer";
const ROLE_NAME = "SUPER_ADMIN";

function requiredPassword(): string {
  const value = process.env.SENIOR_DEVELOPER_PASSWORD;
  if (!value || value.trim().length === 0) {
    throw new Error(
      "SENIOR_DEVELOPER_PASSWORD must be set to a non-empty value before running this script"
    );
  }
  return value;
}

const prisma = new PrismaClient();

async function main() {
  const password = requiredPassword();
  const role = await prisma.role.findUnique({ where: { name: ROLE_NAME } });
  if (!role) {
    throw new Error(
      `Role ${ROLE_NAME} not found. Run the main seed first: npm run -w @bigwing/db seed`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: { password: passwordHash, fullName: FULL_NAME, isActive: true },
    create: {
      username: USERNAME,
      password: passwordHash,
      fullName: FULL_NAME,
      isActive: true,
      userRoles: { create: { roleId: role.id } },
    },
    include: { userRoles: true },
  });

  // Ensure the SUPER_ADMIN role mapping exists even for pre-existing users
  const hasRole = user.userRoles.some((ur) => ur.roleId === role.id);
  if (!hasRole) {
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
  }

  console.log(`Senior developer account ready — ${USERNAME} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
