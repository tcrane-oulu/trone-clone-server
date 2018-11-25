import { EventEmitter } from 'events';

export interface EventListener {
  remove: () => void;
}

/**
 * A simple `EventEmitter` wrapper which simplifies
 * the process of managing event listeners.
 */
export class Emitter {
  private emitter: EventEmitter;
  constructor() {
    this.emitter = new EventEmitter();
  }

  emit(event: string, ...args: any[]) {
    this.emitter.emit(event, ...args);
  }

  on(event: string, listener: (...args: any[]) => any): EventListener {
    this.emitter.on(event, listener);
    return {
      remove: () => {
        this.emitter.removeListener(event, listener);
      },
    };
  }

  once(event: string, listener: (...args: any[]) => any): EventListener {
    this.emitter.once(event, listener);
    return {
      remove: () => {
        this.emitter.removeListener(event, listener);
      },
    };
  }

  removeAllListeners(event: string) {
    this.emitter.removeAllListeners(event);
  }
}
