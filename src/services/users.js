import { storage } from "./storage";
const KEY = "jr_users";
const SESSION = "jr_session";

export const users = {
  list() { return storage.get(KEY, []); },
  current() { return storage.get(SESSION, null); },
  setCurrent(user) { storage.set(SESSION, user); },
  logout() { storage.remove(SESSION); },
  loginByEmail(email) {
    const u = this.list().find(x => x.email === email);
    if (u) this.setCurrent(u);
    return u;
  },
};
