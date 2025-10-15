import { storage } from "./storage";
const KEY = "jr_products"; // tu clave actual

export const products = {
  all() { return storage.get(KEY, []); },
  save(prod) {
    const arr = storage.get(KEY, []);
    const i = arr.findIndex(p => p.id === prod.id);
    if (i >= 0) arr[i] = prod; else arr.push(prod);
    storage.set(KEY, arr);
    return prod;
  },
  remove(id) {
    const arr = (storage.get(KEY, []) || []).filter(p => p.id !== id);
    storage.set(KEY, arr);
  },
};