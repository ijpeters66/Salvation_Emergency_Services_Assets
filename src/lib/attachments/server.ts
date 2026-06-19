import { writeAuditLog } from "@/lib/audit-log";
import {
  ATTACHMENTS_BUCKET,
  type DocumentAttachmentInsert,
  type DocumentAttachmentUpdate,
} from "@/lib/attachments";
import type { AttachmentOwnerType, UserRole } from "@/lib/domain-types";
import { getPublicEnvStatus } from "@/lib/env";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listDocumentAttachments(
  ownerType: AttachmentOwnerType,
  ownerId: string,
  role: UserRole,
  includeArchived = false,
) {
  if (!getPublicEnvStatus().configured) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("document_attachment")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!includeArchived || role !== "system_admin") {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) {
    return [];
  }

  return Promise.all(
    data.map(async (attachment) => {
      const { data: signedUrlData } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .createSignedUrl(attachment.file_path, 60 * 60);

      return {
        ...attachment,
        signedUrl: signedUrlData?.signedUrl ?? null,
      };
    }),
  );
}

export async function getDocumentAttachmentById(id: string) {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("document_attachment")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getCurrentSupabaseUserId() {
  if (!getPublicEnvStatus().configured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export function createSupabaseAttachmentDependencies() {
  return {
    async uploadFile(path: string, file: File) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) {
        return err(error.message);
      }

      return ok({ path });
    },
    async removeFile(path: string) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);

      if (error) {
        return err(error.message);
      }

      return ok(null);
    },
    async insertAttachment(payload: DocumentAttachmentInsert) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("document_attachment")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    async updateAttachment(id: string, payload: DocumentAttachmentUpdate) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("document_attachment")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return err(error.message);
      }

      return ok(data);
    },
    writeAuditLog,
  };
}
