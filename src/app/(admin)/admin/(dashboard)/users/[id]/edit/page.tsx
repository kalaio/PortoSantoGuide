import { notFound } from "next/navigation";
import UserEditorClient from "@/app/(admin)/components/UserEditorClient";
import { requireServerUserWithRole } from "@/lib/admin-auth-server";
import { prisma } from "@/lib/prisma";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const authUser = await requireServerUserWithRole(["ADMINISTRATOR"]);
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  if (!user) {
    notFound();
  }

  return <UserEditorClient mode="edit" currentUserId={authUser.userId} initialUser={user} />;
}
