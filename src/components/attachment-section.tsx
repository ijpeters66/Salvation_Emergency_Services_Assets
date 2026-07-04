import Link from "next/link";
import { Archive, Eye, Trash2, Upload } from "lucide-react";

import {
  archiveAttachmentAction,
  deleteAttachmentAction,
  uploadAttachmentAction,
} from "@/app/attachments/actions";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  type DocumentAttachmentRow,
} from "@/lib/attachments";
import type { AttachmentOwnerType, UserRole } from "@/lib/domain-types";

type AttachmentWithUrl = DocumentAttachmentRow & {
  signedUrl: string | null;
};

const attachmentStatusMessages: Record<string, string> = {
  uploaded: "Attachment uploaded.",
  archived: "Attachment archived.",
  deleted: "Attachment deleted from storage.",
  missing: "Attachment could not be found.",
  "validation-error": "Choose a supported file before uploading.",
  "auth-error": "You do not have permission to delete this attachment.",
  "Choose a file to upload.": "Choose a file to upload.",
  "Attachment exceeds the 10 MB upload limit.": "Attachment exceeds the 10 MB upload limit.",
  "Unsupported file type.": "Unsupported file type.",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentSection({
  attachments,
  ownerId,
  ownerType,
  redirectPath,
  role,
  title,
  subtitle,
  status,
}: {
  attachments: AttachmentWithUrl[];
  ownerType: AttachmentOwnerType;
  ownerId: string;
  redirectPath: string;
  role: UserRole;
  title: string;
  subtitle: string;
  status?: string | null;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-white p-5">
      <div className="flex items-center gap-2">
        <Upload className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{subtitle}</p>

      {status ? (
        <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm font-medium text-[var(--ink)]">
          {attachmentStatusMessages[status] ?? status}
        </p>
      ) : null}

      <form action={uploadAttachmentAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input name="ownerType" type="hidden" value={ownerType} />
        <input name="ownerId" type="hidden" value={ownerId} />
        <input name="redirectPath" type="hidden" value={redirectPath} />
        <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
          Upload file
          <input
            accept={ACCEPTED_ATTACHMENT_MIME_TYPES.join(",")}
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-red)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            name="file"
            type="file"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit">Upload</Button>
        </div>
      </form>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
        Supported file types: PDF, Office documents, JPEG, PNG, WEBP, and HEIC. Maximum file size:{" "}
        {formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.
      </p>

      {attachments.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {attachments.map((attachment) => (
                <tr key={attachment.id}>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{attachment.file_name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{attachment.mime_type}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatFileSize(attachment.file_size)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{attachment.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {attachment.archived_at ? "Archived" : "Active"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {attachment.signedUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={attachment.signedUrl} target="_blank">
                            <Eye className="size-4" aria-hidden="true" />
                            Preview/download
                          </Link>
                        </Button>
                      ) : null}
                      {!attachment.archived_at ? (
                        <ConfirmActionForm
                          action={archiveAttachmentAction}
                          confirmMessage={`Archive ${attachment.file_name}?`}
                        >
                          <input name="attachmentId" type="hidden" value={attachment.id} />
                          <input name="redirectPath" type="hidden" value={redirectPath} />
                          <Button size="sm" type="submit" variant="outline">
                            <Archive className="size-4" aria-hidden="true" />
                            Archive
                          </Button>
                        </ConfirmActionForm>
                      ) : null}
                      {role === "system_admin" ? (
                        <ConfirmActionForm
                          action={deleteAttachmentAction}
                          confirmMessage={`Permanently delete ${attachment.file_name}? This cannot be undone.`}
                        >
                          <input name="attachmentId" type="hidden" value={attachment.id} />
                          <input name="redirectPath" type="hidden" value={redirectPath} />
                          <Button size="sm" type="submit" variant="outline">
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete
                          </Button>
                        </ConfirmActionForm>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
          No attachments have been uploaded yet.
        </p>
      )}
    </section>
  );
}
