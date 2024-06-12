import { PublicKey, Statement } from '../../..';
import { ProtocolEvent } from '../../ProtocolEvent';
import { AgreementAttemptPhase } from '../AgreementAttempt';

export class MovedToAcceptPhaseEvent extends ProtocolEvent {
	readonly subType = 'MovedToAcceptPhaseEvent';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly agreementAttemptPhase: AgreementAttemptPhase
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey}][${
			this.subType
		}] Attempt on ${this.statement.toString()} moved to phase ${
			this.agreementAttemptPhase
		}`;
	}
}
