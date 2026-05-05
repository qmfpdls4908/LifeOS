import { generateId } from '../utils/idGenerator.js';

export class Review {
  constructor({ id, weekOf, keep, problem, tryNext }) {
    this.id = id ?? generateId();
    this.weekOf = weekOf;        // '2026-W18'
    this.keep = keep ?? '';
    this.problem = problem ?? '';
    this.tryNext = tryNext ?? '';
  }
}
