import { Event } from './Event';

export interface IEventBus {
	emit(event: Event, payload?: Record<string, unknown>): void;
	on(event: Event, callback: (event: Event) => void): void;
	off(event: Event): void;
}
