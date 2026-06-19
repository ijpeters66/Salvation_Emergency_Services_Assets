import type { AuditLogInput } from "@/lib/audit-log";
import type { Database } from "@/lib/database.types";
import type { AttachmentOwnerType } from "@/lib/domain-types";
import { err, ok, type AppResult } from "@/lib/result";

export const ATTACHMENTS_BUCKET = "document-attachments";
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/heic",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type DocumentAttachmentRow = Database["public"]["Tables"]["document_attachment"]["Row"];
export type DocumentAttachmentInsert =
  Database["public"]["Tables"]["document_attachment"]["Insert"];
export type DocumentAttachmentUpdate =
  Database["public"]["Tables"]["document_attachment"]["Update"];

export type AttachmentUploadInput = {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  file: File;
};

export type AttachmentDependencies = {
  uploadFile(path: string, file: File): Promise<AppResult<{ path: string }>>;
  removeFile(path: string): Promise<AppResult<null>>;
  insertAttachment(payload: DocumentAttachmentInsert): Promise<AppResult<DocumentAttachmentRow>>;
  updateAttachment(
    id: string,
    payload: DocumentAttachmentUpdate,
  ): Promise<AppResult<DocumentAttachmentRow>>;
  writeAuditLog(input: AuditLogInput): Promise<AppResult<unknown>>;
};

export function sanitiseAttachmentName(fileName: string) {
  const cleaned = fileName.trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9._-]/g, "");
  return cleaned.length > 0 ? cleaned : "attachment";
}

export function validateAttachmentFile(file: File) {
  if (!file || file.size === 0) {
    return err("Choose a file to upload.");
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return err("Attachment exceeds the 10 MB upload limit.");
  }

  if (!ACCEPTED_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof ACCEPTED_ATTACHMENT_MIME_TYPES)[number])) {
    return err("Unsupported file type.");
  }

  return ok(file);
}

export function buildAttachmentPath(ownerType: AttachmentOwnerType, ownerId: string, fileName: string) {
  const safeName = sanitiseAttachmentName(fileName);
  return `${ownerType}/${ownerId}/${Date.now()}-${safeName}`;
}

export function buildAttachmentInsertPayload(
  input: {
    ownerType: AttachmentOwnerType;
    ownerId: string;
    file: File;
    filePath: string;
  },
  userId: string,
): DocumentAttachmentInsert {
  return {
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    file_name: input.file.name,
    file_path: input.filePath,
    mime_type: input.file.type,
    file_size: input.file.size,
    uploaded_by: userId,
  };
}

export async function createAttachmentRecord(
  dependencies: AttachmentDependencies,
  input: AttachmentUploadInput,
  userId: string,
) {
  const validation = validateAttachmentFile(input.file);
  if (!validation.ok) {
    return validation;
  }

  const filePath = buildAttachmentPath(input.ownerType, input.ownerId, input.file.name);
  const uploadResult = await dependencies.uploadFile(filePath, input.file);
  if (!uploadResult.ok) {
    return uploadResult;
  }

  const insertPayload = buildAttachmentInsertPayload(
    {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      file: input.file,
      filePath: uploadResult.data.path,
    },
    userId,
  );
  const insertResult = await dependencies.insertAttachment(insertPayload);

  if (!insertResult.ok) {
    await dependencies.removeFile(uploadResult.data.path);
    return insertResult;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "attachment.upload",
    recordType: "document_attachment",
    recordId: insertResult.data.id,
    newValue: insertResult.data,
  });

  return ok(insertResult.data);
}

export async function archiveAttachmentRecord(
  dependencies: AttachmentDependencies,
  attachment: DocumentAttachmentRow,
  userId: string,
  archivedAt = new Date(),
) {
  const payload: DocumentAttachmentUpdate = {
    archived_at: archivedAt.toISOString(),
  };
  const result = await dependencies.updateAttachment(attachment.id, payload);
  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "attachment.archive",
    recordType: "document_attachment",
    recordId: attachment.id,
    oldValue: attachment,
    newValue: result.data,
  });

  return ok(result.data);
}

export async function deleteAttachmentRecord(
  dependencies: AttachmentDependencies,
  attachment: DocumentAttachmentRow,
  userId: string,
  archivedAt = new Date(),
) {
  const deleteResult = await dependencies.removeFile(attachment.file_path);
  if (!deleteResult.ok) {
    return deleteResult;
  }

  const payload: DocumentAttachmentUpdate = {
    archived_at: archivedAt.toISOString(),
  };
  const result = await dependencies.updateAttachment(attachment.id, payload);
  if (!result.ok) {
    return result;
  }

  await dependencies.writeAuditLog({
    userId,
    actionType: "attachment.delete",
    recordType: "document_attachment",
    recordId: attachment.id,
    oldValue: attachment,
    newValue: result.data,
  });

  return ok(result.data);
}
