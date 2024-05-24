import { AgreementAttempt } from '../AgreementAttempt';
import { QuorumService } from '../../../services/QuorumService';
import { Node } from '../../..';

export class ConfirmHandler {
	constructor(private quorumService: QuorumService) {}

	tryToMoveToConfirmPhase(
		node: Node,
		agreementAttempt: AgreementAttempt
	): boolean {
		if (!this.canMoveToConfirmPhase(node, agreementAttempt)) {
			return false;
		}

		node.moveAgreementAttemptToConfirmPhase(agreementAttempt);

		return true;
	}

	private canMoveToConfirmPhase(
		node: Node,
		agreementAttempt: AgreementAttempt
	): boolean {
		if (node.getAgreementAttemptInAcceptedOrConfirmedPhase() !== null)
			return false;

		return this.isRatified(node, agreementAttempt);
	}

	private isRatified(node: Node, agreementAttempt: AgreementAttempt): boolean {
		const nodeSet = agreementAttempt.getAcceptVotes().map((vote) => vote.node);

		return this.quorumService.containsQuorumForV(
			node.quorumSet,
			nodeSet,
			node.peerQuorumSets
		);
	}
}
