export class Router {
  #routes = new Map();
  #container;
  #rootElement;

  constructor(container, rootElementId = 'app-content') {
    this.#container = container;
    this.#rootElement = document.getElementById(rootElementId);
  }

  register(hash, viewToken) {
    this.#routes.set(hash, viewToken);
  }

  start() {
    window.addEventListener('hashchange', () => this.#navigate());
    this.#navigate();
  }

  #navigate() {
    const hash = location.hash.slice(1) || 'dashboard';
    const viewToken = this.#routes.get(hash) || 'DashboardView';
    
    if (this.#rootElement) {
      this.#rootElement.innerHTML = '';
      try {
        const view = this.#container.resolve(viewToken);
        view.mount(this.#rootElement);
      } catch (e) {
        console.error(e);
        this.#rootElement.innerHTML = `<div class="error" style="color:red; padding:2rem;">View Error: ${e.message}</div>`;
      }
    }
  }
}
