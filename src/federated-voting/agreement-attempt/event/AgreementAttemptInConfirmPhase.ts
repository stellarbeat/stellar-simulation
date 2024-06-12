import { PublicKey } from '../../..';
import { ProtocolEvent } from '../../ProtocolEvent';
import { Statement } from '../../Statement';
import { AgreementAttemptPhase } from '../AgreementAttempt';

export class AgreementAttemptInConfirmPhase extends ProtocolEvent {
	readonly subType = 'AgreementAttemptInConfirmPhase';

	constructor(
		public readonly publicKey: PublicKey,
		public readonly agreementAttemptPhase: AgreementAttemptPhase,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey}][${
			this.subType
		}] Agreement attempt on ${this.statement.toString()} moved to phase ${
			this.agreementAttemptPhase
		}`;
	}
}
