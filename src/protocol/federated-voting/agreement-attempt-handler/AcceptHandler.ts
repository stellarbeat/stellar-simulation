import { VBlockingNodesDetector } from '../../../services/VBlockingNodesDetector';
import { QuorumService } from '../../../services/QuorumService';
import { AgreementAttempt } from '../AgreementAttempt';
import { Node } from '../Node';
import assert from 'assert';

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

		node.moveAgreementAttemptToAcceptPhase(agreementAttempt); //todo move to FederatedVoting protocol and rename this class

		return true;
	}

	private canMoveToAcceptPhase(
		node: Node,
		agreementAttempt: AgreementAttempt
	): boolean {
		assert(
			node.getAgreementAttemptFor(agreementAttempt.statement) ===
				agreementAttempt
		);

		if (node.getAgreementAttemptInAcceptedOrConfirmedPhase() !== null)
			return false;

		if (this.isVBlocking(node, agreementAttempt)) {
			return true;
		}

		if (this.isRatified(node, agreementAttempt)) {
			return true;
		}

		return false;
	}

	private isVBlocking(node: Node, agreementAttempt: AgreementAttempt): boolean {
		console.log(this.vBlockingNodesDetector.isSetVBlocking);
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
