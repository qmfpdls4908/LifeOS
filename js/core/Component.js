export class Component {
  constructor() {
    this.element = null;
  }

  render() {
    return `<div></div>`;
  }

  mount(parentElement) {
    if (!this.element) {
      const template = document.createElement('template');
      template.innerHTML = this.render().trim();
      this.element = template.content.firstElementChild;
      this.setupEvents();
    }
    parentElement.appendChild(this.element);
    this.onMounted();
  }

  setupEvents() {
    // Override to add DOM event listeners
  }

  onMounted() {
    // Override to handle post-mount logic
  }
  
  destroy() {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
