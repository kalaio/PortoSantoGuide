import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSessionCookieName, verifySessionToken } from "@/lib/admin-auth";

const getCachedServerAuthUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
});

export async function getServerAuthUser() {
  return getCachedServerAuthUser();
}

export async function requireServerAdminUser() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/admin/login");
  }

  if (user.role === "SUBSCRIBER") {
    redirect("/admin/forbidden");
  }

  return user;
}

export async function requireServerUserWithRole(roles: Role[]) {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/admin/login");
  }

  if (!roles.includes(user.role)) {
    redirect("/admin/forbidden");
  }

  return user;
}
