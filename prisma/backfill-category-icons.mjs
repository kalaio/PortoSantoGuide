import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_ICON_MAP = {
  fastfood: "snack-bar",
  hiking: "compass",
  local_pizza: "pizza",
  restaurant: "fork-knife",
  travel_explore: "viewpoint"
};

async function main() {
  const categories = await prisma.listingCategory.findMany({
    select: {
      id: true,
      iconName: true,
      slug: true
    }
  });

  let updatedCount = 0;

  for (const category of categories) {
    const normalized = category.iconName?.trim().toLowerCase() ?? null;
    const nextIconName = normalized ? LEGACY_ICON_MAP[normalized] ?? null : null;

    if (!nextIconName || nextIconName === category.iconName) {
      continue;
    }

    await prisma.listingCategory.update({
      where: { id: category.id },
      data: { iconName: nextIconName }
    });

    updatedCount += 1;
    console.log(`Updated ${category.slug}: ${category.iconName} -> ${nextIconName}`);
  }

  console.log(`Backfill complete. Updated ${updatedCount} categories.`);
}

main()
  .catch((error) => {
    console.error("Failed to backfill category icons", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
