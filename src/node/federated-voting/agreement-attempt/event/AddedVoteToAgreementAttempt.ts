import { PublicKey } from '../../../..';
import { ProtocolEvent } from '../../../ProtocolEvent';
import { Statement } from '../../../Statement';
import { Vote } from '../../Vote';
import { AgreementAttemptPhase } from '../AgreementAttempt';

export class AddedVoteToAgreementattempt extends ProtocolEvent {
	readonly subType = 'AddedVoteToAgreementattempt';

	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly vote: Vote,
		public readonly currentPhase: AgreementAttemptPhase
	) {
		super();
	}

	toString(): string {
		return `[${
			this.subType
		}] Add ${this.vote.toString()} to agreement attempt on ${this.statement.toString()} of node ${this.publicKey.toString()} currently in phase: ${
			this.currentPhase
		}`;
	}
}
