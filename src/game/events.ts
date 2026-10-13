import type { GameEventMap } from './types';

export type EventCallback<T> = (data: T) => void;

export class GameEventBus {
  private listeners = new Map<keyof GameEventMap, Set<EventCallback<unknown>>>();

  on<K extends keyof GameEventMap>(event: K, cb: EventCallback<GameEventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as EventCallback<unknown>);
    return () => this.off(event, cb);
  }

  off<K extends keyof GameEventMap>(event: K, cb: EventCallback<GameEventMap[K]>): void {
    this.listeners.get(event)?.delete(cb as EventCallback<unknown>);
  }

  emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[GameEventBus] Error in listener for event "${String(event)}":`, err);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
