import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const prisma = new PrismaClient();

function requiredPassword(): string {
  const value = process.env.REDWING_ADMIN_PASSWORD;
  if (!value || value.trim().length === 0) {
    throw new Error(
      'REDWING_ADMIN_PASSWORD must be set to a non-empty value before creating the Redwing admin'
    );
  }
  return value;
}

async function main() {
  const email = 'redwing@bigwing.in';
  
  // Check if exists
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    const hashedPassword = await bcrypt.hash(requiredPassword(), 12);
    const role = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: 'Redwing Admin',
        isActive: true,
        userRoles: {
          create: { roleId: role!.id }
        }
      }
    });
    console.log('Created user:', user.email);
  } else {
    console.log('User already exists:', user.email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
