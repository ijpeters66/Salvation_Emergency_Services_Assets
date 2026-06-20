import {
  createOfflineMutation,
  deserializeOfflineMutation,
  serializeOfflineMutation,
  type OfflineMutationRecord,
} from "@/lib/offline/indexed-db";

export function createMutationQueueEntry(
  input: Partial<OfflineMutationRecord> & {
    operation_type: string;
    entity_type: string;
    entity_id: string;
    payload: Record<string, unknown>;
  },
) {
  return createOfflineMutation(input);
}

export function serializeMutationQueueEntry(record: OfflineMutationRecord) {
  return serializeOfflineMutation(record);
}

export function deserializeMutationQueueEntry(value: string) {
  return deserializeOfflineMutation(value);
}
