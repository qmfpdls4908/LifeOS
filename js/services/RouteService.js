import { DESTINATIONS } from '../config/destinations.js';
import { generateId } from '../utils/idGenerator.js';

export class RouteService {
  #repo;
  #STORAGE_KEY = 'lifeos_destinations';

  constructor(repository) {
    this.#repo = repository;
    this.#seedIfEmpty();
  }

  // ── persistence helpers ──

  #seedIfEmpty() {
    const existing = this.#repo.load(this.#STORAGE_KEY);
    if (!existing || existing.length === 0) {
      const seed = JSON.parse(JSON.stringify(DESTINATIONS));
      this.#repo.save(this.#STORAGE_KEY, seed);
    }
  }

  #load() {
    return this.#repo.load(this.#STORAGE_KEY);
  }

  #save(data) {
    this.#repo.save(this.#STORAGE_KEY, data);
  }

  // ── destination CRUD ──

  getAllDestinations() {
    return this.#load();
  }

  getDestinationById(id) {
    return this.#load().find(d => d.id === id) || null;
  }

  addDestination(name) {
    const data = this.#load();
    const dest = {
      id: generateId(),
      name: name.trim(),
      routes: []
    };
    data.push(dest);
    this.#save(data);
    return dest;
  }

  updateDestination(id, name) {
    const data = this.#load();
    const dest = data.find(d => d.id === id);
    if (!dest) throw new Error('Cannot find destination');
    dest.name = name.trim();
    this.#save(data);
    return dest;
  }

  deleteDestination(id) {
    const data = this.#load();
    const idx = data.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Cannot find destination');
    data.splice(idx, 1);
    this.#save(data);
  }

  // ── route CRUD ──

  addRoute(destId, routeData) {
    const data = this.#load();
    const dest = data.find(d => d.id === destId);
    if (!dest) throw new Error('Cannot find destination');
    const route = {
      id: generateId(),
      method: routeData.method.trim(),
      from: routeData.from.trim(),
      to: routeData.to.trim(),
      duration: routeData.duration.trim(),
      cost: routeData.cost.trim(),
      time: routeData.time?.trim() || null,
      details: routeData.details?.trim() || null,
      images: routeData.images || []
    };
    dest.routes.push(route);
    this.#save(data);
    return route;
  }

  updateRoute(destId, routeId, routeData) {
    const data = this.#load();
    const dest = data.find(d => d.id === destId);
    if (!dest) throw new Error('Cannot find destination');
    const route = dest.routes.find(r => r.id === routeId);
    if (!route) throw new Error('Cannot find route');
    route.method = routeData.method.trim();
    route.from = routeData.from.trim();
    route.to = routeData.to.trim();
    route.duration = routeData.duration.trim();
    route.cost = routeData.cost.trim();
    route.time = routeData.time?.trim() || null;
    route.details = routeData.details?.trim() || null;
    route.images = routeData.images || [];
    this.#save(data);
    return route;
  }

  deleteRoute(destId, routeId) {
    const data = this.#load();
    const dest = data.find(d => d.id === destId);
    if (!dest) throw new Error('Cannot find destination');
    const idx = dest.routes.findIndex(r => r.id === routeId);
    if (idx === -1) throw new Error('Cannot find route');
    dest.routes.splice(idx, 1);
    this.#save(data);
  }

  // ── AI context (interface preserved) ──

  getRouteSummaryForAI() {
    return this.#load().map(d => ({
      id: d.id, name: d.name,
      routes: d.routes.map(r => {
        const summary = {
          method: r.method, from: r.from, to: r.to,
          duration: r.duration, cost: r.cost
        };
        if (r.time) summary.time = r.time;
        if (r.details) summary.details = r.details;
        if (r.images && r.images.length > 0) {
          summary.imageHint = '참조 이미지 ' + r.images.length + '장 있음 (지도/시간표 등)';
        }
        return summary;
      })
    }));
  }
}
