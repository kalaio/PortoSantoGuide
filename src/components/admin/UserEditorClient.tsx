"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_HEADER_ACTIONS_CLASS,
  ADMIN_HEADER_ROW_CLASS,
  ADMIN_HERO_CLASS,
  ADMIN_PAGE_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  ADMIN_TITLE_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { Badge, Button, ButtonLink, Card, Field, FormSection, SelectInput, TextInput } from "@/components/ui";

type UserRole = "ADMINISTRATOR" | "OWNER" | "SUBSCRIBER";

type UserRow = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
};

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiError = {
  error?: string;
  issues?: ApiIssue[];
};

type UserEditorClientProps = {
  mode: "create" | "edit";
  currentUserId: string;
  initialUser?: UserRow;
};

const roleOptions: UserRole[] = ["ADMINISTRATOR", "OWNER", "SUBSCRIBER"];

type UserCreateValidationErrors = {
  username?: string;
  email?: string;
  password?: string;
};

type UserEditValidationErrors = {
  username?: string;
  email?: string;
  password?: string;
};

function getIssueMessage(payload: ApiError, fallback: string) {
  const firstIssue = payload.issues?.[0];
  if (firstIssue?.message) {
    const field = firstIssue.path?.[0];
    const prefix = typeof field === "string" ? `${field}: ` : "";
    return `${prefix}${firstIssue.message}`;
  }

  return payload.error ?? fallback;
}

function getCreateValidationErrors({
  username,
  email,
  password
}: {
  username: string;
  email: string;
  password: string;
}): UserCreateValidationErrors {
  const errors: UserCreateValidationErrors = {};

  if (username.trim().length === 0) {
    errors.username = "Username is required.";
  }

  if (email.trim().length === 0) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (password.trim().length === 0) {
    errors.password = "Password is required.";
  } else if (password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

function getEditValidationErrors({
  username,
  email,
  password
}: {
  username: string;
  email: string;
  password: string;
}): UserEditValidationErrors {
  const errors: UserEditValidationErrors = {};

  if (username.trim().length === 0) {
    errors.username = "Username is required.";
  }

  if (email.trim().length === 0) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (password.trim().length > 0 && password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

function getFieldErrors(payload: ApiError) {
  const errors: UserCreateValidationErrors = {};

  for (const issue of payload.issues ?? []) {
    const field = issue.path?.[0];
    if (typeof field === "string" && (field === "username" || field === "email" || field === "password")) {
      errors[field] = issue.message ?? "Invalid value.";
    }
  }

  return errors;
}

export default function UserEditorClient({ mode, currentUserId, initialUser }: UserEditorClientProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const isProtectedDefaultAdmin = initialUser?.username === "administrator";
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("SUBSCRIBER");
  const [editUsername, setEditUsername] = useState(initialUser?.username ?? "");
  const [editEmail, setEditEmail] = useState(initialUser?.email ?? "");
  const [editRole, setEditRole] = useState<UserRole>(initialUser?.role ?? "SUBSCRIBER");
  const [editIsActive, setEditIsActive] = useState<boolean>(initialUser?.isActive ?? true);
  const [editPassword, setEditPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedCreateSubmit, setHasTriedCreateSubmit] = useState(false);
  const [hasTriedEditSubmit, setHasTriedEditSubmit] = useState(false);
  const [createFieldErrors, setCreateFieldErrors] = useState<UserCreateValidationErrors>({});
  const [editFieldErrors, setEditFieldErrors] = useState<UserEditValidationErrors>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const createValidationErrors = getCreateValidationErrors({
    username: newUsername,
    email: newEmail,
    password: newPassword
  });
  const editValidationErrors = getEditValidationErrors({
    username: editUsername,
    email: editEmail,
    password: editPassword
  });
  const hasCreateValidationErrors = Object.keys(createValidationErrors).length > 0;
  const hasEditValidationErrors = Object.keys(editValidationErrors).length > 0;

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasTriedCreateSubmit(true);
    setCreateFieldErrors({});

    if (hasCreateValidationErrors) {
      setStatusMessage("Please complete the required fields.");
      setStatusTone("error");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole
      })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setCreateFieldErrors(getFieldErrors(payload));
      setStatusMessage(`Could not create user. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      return;
    }

    const payload = (await response.json()) as { data: UserRow };
    router.push(`/admin/users/${payload.data.id}/edit`);
  }

  async function onUpdate() {
    if (!initialUser) {
      return;
    }

    setHasTriedEditSubmit(true);
    setEditFieldErrors({});

    if (hasEditValidationErrors) {
      setStatusMessage("Please fix the highlighted fields.");
      setStatusTone("error");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const payload: {
      username?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
    } = {};

    const normalizedEditUsername = editUsername.trim();
    const normalizedEditEmail = editEmail.trim().toLowerCase();

    if (normalizedEditUsername !== initialUser.username) {
      payload.username = normalizedEditUsername;
    }

    if (normalizedEditEmail !== initialUser.email) {
      payload.email = normalizedEditEmail;
    }

    if (editRole !== initialUser.role) {
      payload.role = editRole;
    }

    if (editIsActive !== initialUser.isActive) {
      payload.isActive = editIsActive;
    }

    if (editPassword.trim().length > 0) {
      payload.password = editPassword.trim();
    }

    if (Object.keys(payload).length === 0) {
      setIsLoading(false);
      setStatusMessage("No changes to save.");
      setStatusTone(null);
      return;
    }

    const response = await fetch(`/api/admin/users/${initialUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsLoading(false);

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as ApiError;
      setEditFieldErrors(getFieldErrors(errorPayload));
      setStatusMessage(`Could not update user. ${getIssueMessage(errorPayload, "Unknown error")}`);
      setStatusTone("error");
      return;
    }

    const result = (await response.json()) as { data: UserRow };
    setEditUsername(result.data.username);
    setEditEmail(result.data.email);
    setEditRole(result.data.role);
    setEditIsActive(result.data.isActive);
    setEditPassword("");
    setEditFieldErrors({});
    setStatusMessage("User updated.");
    setStatusTone("success");
    router.refresh();
  }

  async function onDeleteConfirmed() {
    if (!initialUser) {
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/users/${initialUser.id}`, {
      method: "DELETE"
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setStatusMessage(`Could not delete user. ${getIssueMessage(payload, "Unknown error")}`);
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      return;
    }

    router.push("/admin/users");
    router.refresh();
  }

  return (
    <main className={ADMIN_PAGE_CLASS}>
      <section className={ADMIN_HERO_CLASS}>
        <div className={ADMIN_HEADER_ROW_CLASS}>
          <h1 className={ADMIN_TITLE_CLASS}>{isCreate ? "New User" : "Edit User"}</h1>
          <div className={ADMIN_HEADER_ACTIONS_CLASS}>
            <ButtonLink variant="secondary" href="/admin/users">
              Back to Users
            </ButtonLink>
          </div>
        </div>
        <p>
          {isCreate
            ? "Create a new admin-managed account with the right role."
            : "Update user role, active status, and password from a dedicated page."}
        </p>
        <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      </section>

      <Card as="section">
        <FormSection title={isCreate ? "User details" : initialUser?.username ?? "User details"}>
          {isCreate ? (
            <form className={ADMIN_FORM_CLASS} onSubmit={onCreate} noValidate>
              <Field label="Username">
                <TextInput
                  value={newUsername}
                  onChange={(event) => {
                    setNewUsername(event.target.value);
                    setCreateFieldErrors((current) => ({ ...current, username: undefined }));
                  }}
                  isInvalid={Boolean((hasTriedCreateSubmit && createValidationErrors.username) || createFieldErrors.username)}
                  errorMessage={createFieldErrors.username ?? (hasTriedCreateSubmit ? createValidationErrors.username : undefined)}
                  required
                />
              </Field>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    setCreateFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  isInvalid={Boolean((hasTriedCreateSubmit && createValidationErrors.email) || createFieldErrors.email)}
                  errorMessage={createFieldErrors.email ?? (hasTriedCreateSubmit ? createValidationErrors.email : undefined)}
                  required
                />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setCreateFieldErrors((current) => ({ ...current, password: undefined }));
                  }}
                  isInvalid={Boolean((hasTriedCreateSubmit && createValidationErrors.password) || createFieldErrors.password)}
                  errorMessage={createFieldErrors.password ?? (hasTriedCreateSubmit ? createValidationErrors.password : undefined)}
                  required
                />
              </Field>
              <Field label="Role">
                <SelectInput value={newRole} onChange={(event) => setNewRole(event.target.value as UserRole)}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <div className={ADMIN_ACTIONS_CLASS}>
                <Button type="submit" disabled={isLoading}>
                  Create user
                </Button>
              </div>
            </form>
          ) : initialUser ? (
            <div className={ADMIN_FORM_CLASS}>
              <Field label="Username">
                <TextInput
                  value={editUsername}
                  onChange={(event) => {
                    setEditUsername(event.target.value);
                    setEditFieldErrors((current) => ({ ...current, username: undefined }));
                  }}
                  isInvalid={Boolean((hasTriedEditSubmit && editValidationErrors.username) || editFieldErrors.username)}
                  errorMessage={editFieldErrors.username ?? (hasTriedEditSubmit ? editValidationErrors.username : undefined)}
                  readOnly={isProtectedDefaultAdmin}
                />
              </Field>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={editEmail}
                  onChange={(event) => {
                    setEditEmail(event.target.value);
                    setEditFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  isInvalid={Boolean((hasTriedEditSubmit && editValidationErrors.email) || editFieldErrors.email)}
                  errorMessage={editFieldErrors.email ?? (hasTriedEditSubmit ? editValidationErrors.email : undefined)}
                />
              </Field>
              <Field label="Role">
                <SelectInput
                  value={editRole}
                  onChange={(event) => setEditRole(event.target.value as UserRole)}
                  disabled={isProtectedDefaultAdmin}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput
                  value={editIsActive ? "true" : "false"}
                  onChange={(event) => setEditIsActive(event.target.value === "true")}
                  disabled={initialUser.id === currentUserId || isProtectedDefaultAdmin}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </SelectInput>
              </Field>
              <Field label="New password" hint="Optional">
                <TextInput
                  type="password"
                  minLength={8}
                  value={editPassword}
                  onChange={(event) => {
                    setEditPassword(event.target.value);
                    setEditFieldErrors((current) => ({ ...current, password: undefined }));
                  }}
                  isInvalid={Boolean((hasTriedEditSubmit && editValidationErrors.password) || editFieldErrors.password)}
                  errorMessage={editFieldErrors.password ?? (hasTriedEditSubmit ? editValidationErrors.password : undefined)}
                  placeholder="Leave blank to keep current"
                />
              </Field>
              <div className={ADMIN_HEADER_ROW_CLASS}>
                <p className="muted">Created: {new Date(initialUser.createdAt).toLocaleString()}</p>
                <Badge tone={editIsActive ? "success" : "neutral"}>{editIsActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div className={ADMIN_ACTIONS_CLASS}>
                <Button type="button" onClick={onUpdate} disabled={isLoading}>
                  Save changes
                </Button>
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isLoading || initialUser.id === currentUserId || isProtectedDefaultAdmin}
                >
                  Delete
                </Button>
              </div>
              {isProtectedDefaultAdmin ? (
                <p className="muted">The default administrator account is protected and cannot be deleted, deactivated, or demoted.</p>
              ) : null}
              {initialUser.id === currentUserId ? (
                <p className="muted">You cannot delete your own account.</p>
              ) : null}
            </div>
          ) : null}
          {statusMessage ? (
            <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{statusMessage}</p>
          ) : null}
        </FormSection>
      </Card>

      <DeleteConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete user?"
        description={`This will remove ${initialUser?.username ?? "this user"} permanently.`}
        isLoading={isLoading}
        onCancel={() => {
          if (isLoading) {
            return;
          }

          setIsDeleteDialogOpen(false);
        }}
        onConfirm={onDeleteConfirmed}
      />
    </main>
  );
}
