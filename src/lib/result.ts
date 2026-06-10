export type AppResult<T, E = string> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: E;
    };

export function ok<T>(data: T): AppResult<T> {
  return {
    ok: true,
    data,
  };
}

export function err<E = string>(error: E): AppResult<never, E> {
  return {
    ok: false,
    error,
  };
}
