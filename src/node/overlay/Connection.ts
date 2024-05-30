import assert from 'assert';
import { PublicKey } from '../..';

export class Connection {
	private constructor(
		public readonly source: PublicKey,
		public readonly target: PublicKey
	) {}

	equals(connection: Connection): boolean {
		return (
			(connection.source === this.source ||
				connection.source === this.target) &&
			(connection.target === this.source || connection.target === this.target)
		);
	}

	static create(source: PublicKey, target: PublicKey): Connection {
		//no self loops
		assert(source !== target);

		return new Connection(source, target);
	}
}
