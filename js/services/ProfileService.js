export class ProfileService {
  #repo;
  #STORAGE_KEY = 'lifeos_profile';

  constructor(repository) {
    this.#repo = repository;
  }

  getProfile() {
    const data = this.#repo.load(this.#STORAGE_KEY);
    return data?.content || '';
  }

  saveProfile(content) {
    this.#repo.save(this.#STORAGE_KEY, { content });
  }
}
