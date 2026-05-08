function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function unwrapPerspectiveResponse<T>(payload: unknown): T | null {
  if (!isRecord(payload)) return null;

  if ("data" in payload) {
    return isRecord(payload.data) ? (payload.data as T) : null;
  }

  if ("perspective" in payload) {
    return isRecord(payload.perspective) ? (payload.perspective as T) : null;
  }

  if ("error" in payload) return null;

  return payload as T;
}
