import { notFound } from "next/navigation";
import SearchSuggestionEditorClient from "@/app/(admin)/components/SearchSuggestionEditorClient";
import { requireServerUserWithRole } from "@/app/(admin)/lib/admin-auth-server";
import { prisma } from "@/lib/prisma";

type EditSearchSuggestionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSearchSuggestionPage({ params }: EditSearchSuggestionPageProps) {
  await requireServerUserWithRole(["ADMINISTRATOR"]);
  const { id } = await params;

  const suggestion = await prisma.searchSuggestion.findUnique({
    where: { id },
    select: {
      id: true,
      label: true,
      query: true,
      priority: true,
      isActive: true
    }
  });

  if (!suggestion) {
    notFound();
  }

  return <SearchSuggestionEditorClient mode="edit" initialSuggestion={suggestion} />;
}
