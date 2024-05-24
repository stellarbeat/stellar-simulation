import { AgreementAttempt } from './AgreementAttempt';
import { QuorumService } from '../../services/QuorumService';
import { Node } from '../../..';
import { AgreementAttemptCollection } from './AgreementAttemptCollection';

export class ConfirmPhaseEvaluator {
	constructor(private quorumService: QuorumService) {}

	canMoveToConfirmPhase(
		agreementAttempt: AgreementAttempt,
		agreementAttempts: AgreementAttemptCollection,
		node: Node
	): boolean {
		if (
			this.getAgreementAttemptInAcceptedOrConfirmedPhase(agreementAttempts) !==
			null
		)
			return false;

		return this.isRatified(node, agreementAttempt);
	}

	private isRatified(node: Node, agreementAttempt: AgreementAttempt): boolean {
		const acceptingPeers =
			agreementAttempt.getPeersThatVotedToAcceptStatement();

		return this.quorumService.containsQuorumForV(
			node.quorumSet,
			acceptingPeers,
			node.peerQuorumSets
		);
	}

	getAgreementAttemptInAcceptedOrConfirmedPhase(
		agreementAttempts: AgreementAttemptCollection
	): AgreementAttempt | null {
		return (
			agreementAttempts
				.getAll()
				.find((attempt) => attempt.phase !== 'unknown') ?? null
		);
	}
}
