import type { AuthUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type AdminSectionRecord = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getAdminSections(user: AuthUser): Promise<AdminSectionRecord[]> {
  if (!hasDatabaseUrl() || user.role !== "ADMINISTRATOR") {
    return [];
  }

  try {
    return await prisma.directorySection.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        slug: true,
        label: true,
        sortOrder: true,
        isActive: true
      }
    });
  } catch {
    return [];
  }
}
