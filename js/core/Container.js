export class Container {
  #registry = new Map();

  register(token, factory, { singleton = true } = {}) {
    this.#registry.set(token, { factory, singleton, instance: null });
  }

  resolve(token) {
    const entry = this.#registry.get(token);
    if (!entry) throw new Error(`[DI] "${token}" not registered`);
    if (entry.singleton) {
      if (!entry.instance) entry.instance = entry.factory(this);
      return entry.instance;
    }
    return entry.factory(this);
  }
}
