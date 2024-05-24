import { VBlockingNodesDetector } from '../../services/VBlockingNodesDetector';
import { QuorumService } from '../../services/QuorumService';
import { AgreementAttempt } from './AgreementAttempt';
import { Node } from '../../Node';
import { AgreementAttemptCollection } from './AgreementAttemptCollection';
import { QuorumSet } from '../../QuorumSet';

export class AcceptPhaseEvaluator {
	constructor(
		private vBlockingNodesDetector: VBlockingNodesDetector,
		private quorumService: QuorumService
	) {}

	canMoveToAcceptPhase(
		agreementAttempt: AgreementAttempt,
		agreementAttemptCollection: AgreementAttemptCollection,
		node: Node
	): boolean {
		if (
			this.getAgreementAttemptInAcceptedOrConfirmedPhase(
				agreementAttemptCollection
			) !== null
		)
			return false;

		if (this.isVBlocking(node.quorumSet, agreementAttempt)) {
			return true;
		}

		if (this.isRatified(node, agreementAttempt)) {
			return true;
		}

		return false;
	}

	private isVBlocking(
		quorumSet: QuorumSet,
		agreementAttempt: AgreementAttempt
	): boolean {
		const acceptingPeers =
			agreementAttempt.getPeersThatVotedToAcceptStatement();

		return this.vBlockingNodesDetector.isSetVBlocking(
			quorumSet,
			acceptingPeers
		);
	}

	private isRatified(node: Node, agreementAttempt: AgreementAttempt): boolean {
		const nodeSet =
			agreementAttempt.getPeersThatVotedForAndVotedToAcceptStatement();

		return this.quorumService.containsQuorumForV(
			node.quorumSet,
			nodeSet,
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
