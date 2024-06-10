import { PublicKey, Statement } from '../../../..';
import { ProtocolEvent } from '../../../ProtocolEvent';
import { QuorumSet } from '../../QuorumSet';

export class RatifiedVote extends ProtocolEvent {
	readonly subType = 'RatifiedVote';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly quorum: Map<string, QuorumSet>
	) {
		super();
	}

	toString(): string {
		return `[${
			this.subType
		}] Vote on ${this.statement.toString()} ratified by quorum ${Array.from(
			this.quorum.keys()
		)} in agreement attempt of node ${this.publicKey.toString()}`;
	}
}
