import { PublicKey, Statement } from '../../../..';
import { ProtocolEvent } from '../../../ProtocolEvent';
import { AgreementAttemptPhase } from '../AgreementAttempt';

export class AcceptVBlocked extends ProtocolEvent {
	readonly subType = 'AcceptVBlocked';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly agreementAttemptPhase: AgreementAttemptPhase,
		public readonly statement: Statement,
		public readonly vBlockingSet: Set<PublicKey>
	) {
		super();
	}

	toString(): string {
		return `[${this.subType}] accept(${this.statement}) votes from ${this.vBlockingSet} are v-blocking in agreement attempt of node ${this.publicKey} currently in phase ${this.agreementAttemptPhase}`;
	}
}
