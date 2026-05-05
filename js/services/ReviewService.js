import { Review } from '../models/Review.js';

export class ReviewService {
  #repo;
  #STORE_KEY = 'reviews';
  #reviews = [];

  constructor(repository) {
    this.#repo = repository;
    this.#reviews = this.#repo.load(this.#STORE_KEY).map(r => new Review(r));
  }

  getAll() {
    return [...this.#reviews].sort((a, b) => b.weekOf.localeCompare(a.weekOf));
  }

  saveReview(data) {
    const existingIdx = this.#reviews.findIndex(r => r.weekOf === data.weekOf);
    if (existingIdx > -1) {
      this.#reviews[existingIdx] = new Review({ ...this.#reviews[existingIdx], ...data });
    } else {
      this.#reviews.push(new Review(data));
    }
    this.#save();
  }

  #save() {
    this.#repo.save(this.#STORE_KEY, this.#reviews);
  }
}
