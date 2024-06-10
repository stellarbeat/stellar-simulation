import { PublicKey, Statement } from '../../../..';
import { ProtocolEvent } from '../../../ProtocolEvent';

import { AgreementAttempt, AgreementAttemptPhase } from '../AgreementAttempt';

export class AgreementAttemptInAcceptPhase extends ProtocolEvent {
	readonly subType = 'AgreementAttemptInAcceptPhase';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly agreementAttemptPhase: AgreementAttemptPhase,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `[${this.subType}] agreement attempt of node ${
			this.publicKey
		} on ${this.statement.toString()} moved to phase ${
			this.agreementAttemptPhase
		}`;
	}
}
