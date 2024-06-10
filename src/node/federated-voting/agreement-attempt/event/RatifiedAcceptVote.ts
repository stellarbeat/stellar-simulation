import { PublicKey, Statement } from '../../../..';
import { ProtocolEvent } from '../../../ProtocolEvent';
import { QuorumSet } from '../../QuorumSet';

export class RatifiedAcceptVote extends ProtocolEvent {
	readonly subType = 'RatifiedAcceptVote';
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
		}] Vote on accept(${this.statement.toString()}) ratified by quorum ${Array.from(
			this.quorum.keys()
		)} in agreement attempt of node ${this.publicKey.toString()}`;
	}
}
