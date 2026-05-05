export class LocalStorageRepo {
  load(key) {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  }
  
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  clear(key) {
    localStorage.removeItem(key);
  }
}
