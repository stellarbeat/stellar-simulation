import { describe, it, mock } from 'node:test';
import { AcceptHandler } from '../../../src/protocol/federated-voting/agreement-attempt-handler/AcceptHandler';
import { QuorumService } from '../../../src/services/QuorumService';
import { VBlockingNodesDetector } from '../../../src/services/VBlockingNodesDetector';
import { Node } from '../../../src';
import assert from 'node:assert';

describe('AcceptHandler', () => {
	const quorumService = new QuorumService();
	const vBlockingNodesDetector = new VBlockingNodesDetector();

	const acceptHandler = new AcceptHandler(
		vBlockingNodesDetector,
		quorumService
	);

	const setupNode = (nodeId: string) => {
		return new Node(nodeId, {
			threshold: 1,
			validators: ['B'],
			innerQSets: []
		});
	};

	describe('tryToMoveToAcceptPhase', () => {
		it('should fail if agreement attempt is not in unknown phase', () => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');
			node.moveAgreementAttemptToAcceptPhase(agreementAttempt);

			const result = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);
			assert.strictEqual(result, false);

			node.moveAgreementAttemptToConfirmPhase(agreementAttempt);
			const result2 = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);
			assert.strictEqual(result2, false);
		});

		it('should fail if another agreement attempt is not in unknown phase', () => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');
			const otherAgreementAttempt = node.startNewAgreementAttempt('statement2');

			node.moveAgreementAttemptToAcceptPhase(otherAgreementAttempt);

			const result = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);
			assert.strictEqual(result, false);

			node.moveAgreementAttemptToConfirmPhase(otherAgreementAttempt);
			const result2 = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);
			assert.strictEqual(result2, false);
		});
	});
});
