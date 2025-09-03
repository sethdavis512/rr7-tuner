import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.post.create({
    data: {
      title: 'Hello World',
      content: 'This is your first post!',
      published: true,
    },
  });

  await prisma.post.create({
    data: {
      title: 'Getting Started with React Router 7',
      content: 'Learn how to build amazing web applications with React Router 7.',
      published: false,
    },
  });

  console.log('Database has been seeded 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });