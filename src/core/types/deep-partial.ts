export type Partial<T> = { [P in keyof T]?: NullOrUndefined<T[P]> };
export type NullOrUndefined<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : DeepPartial<T[P]>;
};
