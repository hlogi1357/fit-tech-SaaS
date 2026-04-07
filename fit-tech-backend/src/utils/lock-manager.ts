export class LockManager {
  // Each key points to the tail of a promise chain for that key.
  // New operations wait on the previous tail before executing.
  private readonly locks = new Map<string, Promise<void>>();

  async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // If this key has no active work, start from a resolved promise.
    const previous = this.locks.get(key) ?? Promise.resolve();

    // `current` becomes the new tail for this key.
    // We hold `release` so we can unblock the next waiter in finally.
    let release: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Queue this operation behind the previous one.
    this.locks.set(key, previous.then(() => current));

    // Wait for previous operation on this key to finish.
    await previous;

    try {
      return await operation();
    } finally {
      // Always release queue progression, even when operation throws.
      release!();
      // Cleanup map entry when this operation is still the tail.
      if (this.locks.get(key) === current) {
        this.locks.delete(key);
      }
    }
  }
}
