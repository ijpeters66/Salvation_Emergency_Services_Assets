import { describe, expect, it } from "vitest";

import {
  createMutationQueueEntry,
  deserializeMutationQueueEntry,
  serializeMutationQueueEntry,
} from "@/lib/offline/mutation-queue";

describe("offline mutation queue serialization", () => {
  it("serializes and deserializes a queue entry", () => {
    const record = createMutationQueueEntry({
      id: "queue-1",
      operation_type: "create",
      entity_type: "maintenance_record",
      entity_id: "record-1",
      payload: {
        asset_id: "asset-7",
        service_type: "inspection",
      },
      created_at: "2026-06-20T12:00:00.000Z",
      retry_count: 1,
      sync_status: "failed",
    });

    const serialized = serializeMutationQueueEntry(record);
    const deserialized = deserializeMutationQueueEntry(serialized);

    expect(deserialized).toEqual(record);
  });
});
