import { storage } from "./storage";
const KEY = "jr_orders";

export const orders = {
  all() { return storage.get(KEY, []); },
  push(order) {
    const arr = storage.get(KEY, []);
    arr.push(order);
    storage.set(KEY, arr);
    return order;
  },
  save(order) {
    const arr = storage.get(KEY, []);
    const i = arr.findIndex(o => o.id === order.id);
    if (i >= 0) arr[i] = order; else arr.push(order);
    storage.set(KEY, arr);
    return order;
  },
  updateStatus(id, status) {
    const arr = storage.get(KEY, []);
    const i = arr.findIndex(o => o.id === id);
    if (i >= 0) { arr[i].status = status; storage.set(KEY, arr); return arr[i]; }
    return null;
  },
};
