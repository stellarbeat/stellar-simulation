import { PublicKey } from '../..';
import { ProtocolEvent } from '../ProtocolEvent';
import { Vote } from '../Vote';

export class Voted extends ProtocolEvent {
	readonly subType = 'Voted';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly vote: Vote
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey.toString()}][${
			this.subType
		}] Vote cast: ${this.vote.toString()}`;
	}
}
