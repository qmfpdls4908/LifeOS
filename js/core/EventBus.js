export class EventBus {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.#listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  off(event, callback) {
    const list = this.#listeners.get(event);
    if (list) {
      this.#listeners.set(event, list.filter(cb => cb !== callback));
    }
  }
}
