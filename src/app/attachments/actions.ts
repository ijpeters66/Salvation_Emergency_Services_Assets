"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  archiveAttachmentRecord,
  createAttachmentRecord,
  deleteAttachmentRecord,
} from "@/lib/attachments";
import {
  createSupabaseAttachmentDependencies,
  getCurrentSupabaseUserId,
  getDocumentAttachmentById,
} from "@/lib/attachments/server";
import { getCurrentUserContext } from "@/lib/auth";
import { isAttachmentOwnerType } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";

function redirectWithAttachmentStatus(path: string, status: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}attachmentStatus=${encodeURIComponent(status)}`);
}

async function getMutationContext() {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const userId = await getCurrentSupabaseUserId();
  if (!userId) {
    return null;
  }

  return {
    userId,
    dependencies: createSupabaseAttachmentDependencies(),
  };
}

export async function uploadAttachmentAction(formData: FormData) {
  const ownerType = String(formData.get("ownerType") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  const redirectPath = String(formData.get("redirectPath") ?? "/dashboard");
  const file = formData.get("file");
  const context = await getMutationContext();

  if (!isAttachmentOwnerType(ownerType) || !ownerId || !(file instanceof File) || !context) {
    redirectWithAttachmentStatus(redirectPath, "validation-error");
  }

  const result = await createAttachmentRecord(
    context.dependencies,
    { ownerType, ownerId, file },
    context.userId,
  );

  if (!result.ok) {
    redirectWithAttachmentStatus(redirectPath, result.error);
  }

  revalidatePath(redirectPath);
  redirectWithAttachmentStatus(redirectPath, "uploaded");
}

export async function archiveAttachmentAction(formData: FormData) {
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const redirectPath = String(formData.get("redirectPath") ?? "/dashboard");
  const context = await getMutationContext();

  if (!attachmentId || !context) {
    redirectWithAttachmentStatus(redirectPath, "validation-error");
  }

  const attachment = await getDocumentAttachmentById(attachmentId);
  if (!attachment) {
    redirectWithAttachmentStatus(redirectPath, "missing");
  }

  const result = await archiveAttachmentRecord(context.dependencies, attachment, context.userId);
  if (!result.ok) {
    redirectWithAttachmentStatus(redirectPath, result.error);
  }

  revalidatePath(redirectPath);
  redirectWithAttachmentStatus(redirectPath, "archived");
}

export async function deleteAttachmentAction(formData: FormData) {
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const redirectPath = String(formData.get("redirectPath") ?? "/dashboard");
  const user = await getCurrentUserContext();
  const context = await getMutationContext();

  if (!attachmentId || !context || user?.role !== "system_admin") {
    redirectWithAttachmentStatus(redirectPath, "auth-error");
  }

  const attachment = await getDocumentAttachmentById(attachmentId);
  if (!attachment) {
    redirectWithAttachmentStatus(redirectPath, "missing");
  }

  const result = await deleteAttachmentRecord(context.dependencies, attachment, context.userId);
  if (!result.ok) {
    redirectWithAttachmentStatus(redirectPath, result.error);
  }

  revalidatePath(redirectPath);
  redirectWithAttachmentStatus(redirectPath, "deleted");
}
