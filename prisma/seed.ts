import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const tasks = [
    {
      title: "QCM",
      description: "Répondez au QCM du lundi.",
      reward: 100,
      dayOfWeek: 1,
    },
    {
      title: "TikTok",
      description: "Effectuez la tâche TikTok du mardi.",
      reward: 100,
      dayOfWeek: 2,
    },
    {
      title: "Instagram",
      description: "Effectuez la tâche Instagram du mercredi.",
      reward: 100,
      dayOfWeek: 3,
    },
    {
      title: "YouTube",
      description: "Effectuez la tâche YouTube du jeudi.",
      reward: 100,
      dayOfWeek: 4,
    },
    {
      title: "Publicités",
      description: "Effectuez la tâche publicitaire du vendredi.",
      reward: 100,
      dayOfWeek: 5,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: {
        title: task.title,
      },
      update: {
        description: task.description,
        reward: task.reward,
        dayOfWeek: task.dayOfWeek,
        isActive: true,
      },
      create: {
        title: task.title,
        description: task.description,
        reward: task.reward,
        dayOfWeek: task.dayOfWeek,
        isActive: true,
      },
    });
  }

  console.log("✅ Les 5 tâches ont été créées ou mises à jour.");
}

main()
  .catch((error) => {
    console.error("❌ Erreur :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
