// Read descriptors, never array iterators or accessor values, at this boundary.
export function readDenseArray(value: unknown): unknown[] | null {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return null;
    const length = Object.getOwnPropertyDescriptor(value, 'length')?.value;
    if (!Number.isSafeInteger(length) || length < 0 || Reflect.ownKeys(value).length !== length + 1) return null;
    const result: unknown[] = [];
    for (let i = 0; i < length; i++) {
      const entry = Object.getOwnPropertyDescriptor(value, String(i));
      if (!entry?.enumerable || !('value' in entry)) return null;
      result.push(entry.value);
    }
    return result;
  } catch { return null; }
}
