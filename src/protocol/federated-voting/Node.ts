import assert from 'assert';
import { PublicKey, Statement } from '../..';
import { QuorumSet } from '../../QuorumSet';
import { AgreementAttempt } from './AgreementAttempt';

export class Node {
	public peerQuorumSets: Map<PublicKey, QuorumSet> = new Map();

	//a node can have many attempts, but only 1 can move to accept and/or confirm phase
	private agreementAttempts: AgreementAttempt[] = [];

	constructor(public publicKey: PublicKey, public quorumSet: QuorumSet) {}

	updateQuorumSet(quorumSet: QuorumSet): void {
		this.quorumSet = quorumSet;
	}

	updatePeerQuorumSet(publicKey: PublicKey, quorumSet: QuorumSet): void {
		this.peerQuorumSets.set(publicKey, quorumSet);
	}

	startNewAgreementAttempt(statement: Statement): AgreementAttempt {
		const attempt = AgreementAttempt.create(statement);
		this.agreementAttempts.push(attempt);
		return attempt;
	}

	getAgreementAttemptFor(statement: Statement): AgreementAttempt | null {
		return (
			this.agreementAttempts.find(
				(attempt) => attempt.statement === statement
			) ?? null
		);
	}

	moveAgreementAttemptToAcceptPhase(agreementAttempt: AgreementAttempt): void {
		assert(this.getAgreementAttemptInAcceptedOrConfirmedPhase() === null);
		agreementAttempt.phase = 'accepted';
	}

	moveAgreementAttemptToConfirmPhase(agreementAttempt: AgreementAttempt): void {
		assert(this.getAgreementAttemptInAcceptedOrConfirmedPhase() === null);
		agreementAttempt.phase = 'confirmed';
	}

	getAgreementAttemptInAcceptedOrConfirmedPhase(): AgreementAttempt | null {
		return (
			this.agreementAttempts.find((attempt) => attempt.phase !== 'unknown') ??
			null
		);
	}
}
