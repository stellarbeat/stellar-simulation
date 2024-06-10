import { ProtocolEvent } from '../../ProtocolEvent';
import { AgreementAttempt } from '../agreement-attempt/AgreementAttempt';

export class AgreementAttemptCreated extends ProtocolEvent {
	readonly subType = 'AgreementAttemptCreated';

	constructor(public readonly agreementAttempt: AgreementAttempt) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.agreementAttempt.toString()}`;
	}
}
