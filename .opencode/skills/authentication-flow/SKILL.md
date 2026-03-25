---
name: authentication-flow
description: Session management, role-based access control, and authentication patterns for ADMINISTRATOR, OWNER, and SUBSCRIBER roles
license: MIT
compatibility: opencode
metadata:
  auth: Session-based
  roles: "ADMINISTRATOR, OWNER, SUBSCRIBER"
---

## What This Skill Covers

Authentication and authorization patterns for the PortoSantoGuide role-based system.

## Role Definitions

- **ADMINISTRATOR**: Full system access, can manage users and all listings
- **OWNER**: Can create and manage their own listings
- **SUBSCRIBER**: Can view listings, submit reviews, manage profile

## Session Management

### Session Cookie Requirements
- HttpOnly
- SameSite=Strict
- Secure (in production)
- Signed and revocable server-side

### Creating Sessions
```ts
import { SignJWT } from 'jose';

async function createSession(userId: string, role: UserRole) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
    
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
```

### Validating Sessions
```ts
import { jwtVerify } from 'jose';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as { userId: string; role: UserRole };
  } catch {
    return null;
  }
}
```

## Authorization Patterns

### Role Checks
```ts
// Middleware or API route
async function requireRole(requiredRole: UserRole) {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const roleHierarchy = {
    SUBSCRIBER: 1,
    OWNER: 2,
    ADMINISTRATOR: 3,
  };
  
  if (roleHierarchy[session.role] < roleHierarchy[requiredRole]) {
    throw new Error('Forbidden');
  }
  
  return session;
}
```

### Route-Level Protection
```ts
// app/admin/layout.tsx
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (session?.role !== 'ADMINISTRATOR') {
    redirect('/login');
  }
  
  return <>{children}</>;
}
```

### API Route Protection
```ts
// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await requireRole('ADMINISTRATOR');
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## Resource Ownership

```ts
// Check if user owns a listing
async function requireListingOwnership(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true }
  });
  
  if (listing?.ownerId !== userId) {
    throw new Error('Not owner');
  }
}

// Combined check (admin or owner)
async function canModifyListing(listingId: string, session: Session) {
  if (session.role === 'ADMINISTRATOR') return true;
  
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true }
  });
  
  return listing?.ownerId === session.userId;
}
```

## Password Security

```ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## Session Revocation

```ts
// After password change or logout
async function revokeSession() {
  cookies().delete('session');
  // Optionally: add to blacklist in database
}

// Revoke all sessions for a user
async function revokeAllUserSessions(userId: string) {
  // Update user session version in database
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } }
  });
}
```

## When to Use

Use this skill when:
- Implementing authentication flows
- Creating protected routes
- Checking role-based permissions
- Managing sessions and logout
- Verifying resource ownership
