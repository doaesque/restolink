import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  // setup connection pool with postgresql
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  // inject the serverless-compatible adapter to the client
  return new PrismaClient({ adapter });
};

// declare global variable to hold prisma instance and avoid exhaustion
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// assign strictly on development environments
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// default export for ease of access
export default prisma;
