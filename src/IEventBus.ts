export interface IEventBus {
	emit(event: string, payload?: Record<string, unknown>): void;
	on(
		event: string,
		callback?: (payload: Record<string, unknown>) => void
	): void;
	off(
		event: string,
		callback?: (payload: Record<string, unknown>) => void
	): void;
}
