import { NextResponse } from "next/server";

import type { OfflineMutationRecord } from "@/lib/offline/indexed-db";
import { getPublicEnvStatus } from "@/lib/env";
import { processOfflineMutation } from "@/lib/offline/server-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!getPublicEnvStatus().configured) {
    return NextResponse.json({ ok: false, message: "Offline sync is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const mutation = (await request.json()) as OfflineMutationRecord;
  const result = await processOfflineMutation(mutation, user.id);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        conflict: result.status === 409,
        mutationId: mutation.id,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    mutationId: mutation.id,
    serverEntityId: result.recordId,
    serverUpdatedAt: result.updatedAt ?? null,
  });
}
