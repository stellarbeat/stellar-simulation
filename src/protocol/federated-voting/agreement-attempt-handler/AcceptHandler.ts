import { VBlockingNodesDetector } from '../../../services/VBlockingNodesDetector';
import { QuorumService } from '../../../services/QuorumService';
import { AgreementAttempt } from '../AgreementAttempt';
import { Node } from '../Node';

//handles vote(statement) and vote(accept(statement)) messages
export class AcceptHandler {
	constructor(
		private vBlockingNodesDetector: VBlockingNodesDetector,
		private quorumService: QuorumService
	) {}

	public tryToMoveToAcceptPhase(
		node: Node,
		agreementAttempt: AgreementAttempt
	): boolean {
		if (!this.canMoveToAcceptPhase(node, agreementAttempt)) {
			return false;
		}

		node.moveAgreementAttemptToAcceptPhase(agreementAttempt);

		return true;
	}

	private canMoveToAcceptPhase(
		node: Node,
		agreementAttempt: AgreementAttempt
	): boolean {
		if (node.getAgreementAttemptInAcceptedOrConfirmedPhase !== null)
			return false;

		if (agreementAttempt.phase !== 'unknown') {
			return false;
		}

		if (this.isVBlocking(node, agreementAttempt)) {
			return true;
		}

		if (this.isRatified(node, agreementAttempt)) {
			return true;
		}

		return false;
	}

	private isVBlocking(node: Node, agreementAttempt: AgreementAttempt): boolean {
		const acceptingNodes = agreementAttempt
			.getAcceptVotes()
			.map((vote) => vote.node);

		return this.vBlockingNodesDetector.isSetVBlocking(
			node.quorumSet,
			acceptingNodes
		);
	}

	private isRatified(node: Node, agreementAttempt: AgreementAttempt): boolean {
		const nodeSet = agreementAttempt.getAllVotes().map((vote) => vote.node);

		return this.quorumService.containsQuorumForV(
			node.quorumSet,
			nodeSet,
			node.peerQuorumSets
		);
	}
}
