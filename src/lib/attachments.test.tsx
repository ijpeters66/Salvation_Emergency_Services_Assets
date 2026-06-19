import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AttachmentSection } from "@/components/attachment-section";
import {
  buildAttachmentInsertPayload,
  buildAttachmentPath,
  createAttachmentRecord,
  MAX_ATTACHMENT_SIZE_BYTES,
  validateAttachmentFile,
  type AttachmentDependencies,
} from "@/lib/attachments";
import { ok } from "@/lib/result";

function createFile(name: string, type: string, content = "demo") {
  return new File([content], name, { type });
}

describe("attachment validation", () => {
  it("accepts supported file types", () => {
    const result = validateAttachmentFile(createFile("photo.jpg", "image/jpeg"));
    expect(result.ok).toBe(true);
  });

  it("rejects unsupported file types", () => {
    const result = validateAttachmentFile(createFile("script.sh", "text/plain"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unsupported file type.");
  });

  it("rejects oversized files", () => {
    const bytes = "a".repeat(MAX_ATTACHMENT_SIZE_BYTES + 1);
    const result = validateAttachmentFile(createFile("big.pdf", "application/pdf", bytes));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Attachment exceeds the 10 MB upload limit.");
  });
});

describe("attachment service", () => {
  it("builds deterministic path and metadata payloads", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T08:00:00.000Z"));

    const file = createFile("Fleet Checklist.pdf", "application/pdf");
    const path = buildAttachmentPath("asset", "asset-1", file.name);

    expect(path).toBe("asset/asset-1/1781856000000-Fleet-Checklist.pdf");

    const payload = buildAttachmentInsertPayload(
      { ownerType: "asset", ownerId: "asset-1", file, filePath: path },
      "user-1",
    );

    expect(payload.file_name).toBe("Fleet Checklist.pdf");
    expect(payload.file_path).toBe(path);
    expect(payload.owner_type).toBe("asset");
    vi.useRealTimers();
  });

  it("creates attachment metadata after storage upload", async () => {
    const file = createFile("photo.jpg", "image/jpeg");
    const dependencies: AttachmentDependencies = {
      uploadFile: vi.fn().mockResolvedValue(ok({ path: "asset/a1/123-photo.jpg" })),
      removeFile: vi.fn().mockResolvedValue(ok(null)),
      insertAttachment: vi.fn().mockResolvedValue(
        ok({
          id: "attachment-1",
          owner_type: "asset",
          owner_id: "asset-1",
          file_name: "photo.jpg",
          file_path: "asset/a1/123-photo.jpg",
          mime_type: "image/jpeg",
          file_size: file.size,
          uploaded_by: "user-1",
          created_at: "2026-06-19T08:00:00.000Z",
          archived_at: null,
        }),
      ),
      updateAttachment: vi.fn(),
      writeAuditLog: vi.fn().mockResolvedValue(ok({})),
    };

    const result = await createAttachmentRecord(
      dependencies,
      { ownerType: "asset", ownerId: "asset-1", file },
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(dependencies.uploadFile).toHaveBeenCalled();
    expect(dependencies.insertAttachment).toHaveBeenCalled();
    expect(dependencies.writeAuditLog).toHaveBeenCalled();
  });
});

describe("AttachmentSection", () => {
  it("renders uploaded attachment rows", () => {
    const markup = renderToStaticMarkup(
      <AttachmentSection
        attachments={[
          {
            id: "attachment-1",
            owner_type: "asset",
            owner_id: "asset-1",
            file_name: "photo.jpg",
            file_path: "asset/a1/123-photo.jpg",
            mime_type: "image/jpeg",
            file_size: 1024,
            uploaded_by: "user-1",
            created_at: "2026-06-19T08:00:00.000Z",
            archived_at: null,
            signedUrl: "https://example.com/file",
          },
        ]}
        ownerId="asset-1"
        ownerType="asset"
        redirectPath="/assets/asset-1"
        role="system_admin"
        subtitle="Upload photos and manuals."
        title="Asset attachments"
      />,
    );

    expect(markup).toContain("Asset attachments");
    expect(markup).toContain("photo.jpg");
    expect(markup).toContain("Preview");
  });
});
