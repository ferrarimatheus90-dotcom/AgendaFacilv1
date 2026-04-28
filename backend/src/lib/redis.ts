// Mock Redis for local testing without server
import EventEmitter from "events";

class RedisMock extends EventEmitter {
  constructor() {
    super();
    setTimeout(() => this.emit("connect"), 100);
  }
  get(key: string) { return Promise.resolve(null); }
  set(key: string, val: string) { return Promise.resolve("OK"); }
  del(key: string) { return Promise.resolve(1); }
  on(event: string, cb: any) { return super.on(event, cb); }
}

export const redis = new RedisMock() as any;
