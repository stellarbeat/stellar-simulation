import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Node } from '../../../src';
import { QuorumService } from '../../../src/services/QuorumService';
import { ConfirmHandler } from '../../../src/protocol/federated-voting/agreement-attempt-handler/ConfirmHandler';
import { Vote } from '../../../src/protocol/federated-voting/Vote';

describe('ConfirmHandler', () => {
	const setupNode = (nodeId: string) => {
		return new Node(nodeId, {
			threshold: 1,
			validators: ['B'],
			innerQSets: []
		});
	};
	const quorumService = new QuorumService();
	const confirmHandler = new ConfirmHandler(quorumService);

	describe('tryToMoveToConfirmPhase', () => {
		it('should fail if agreement attempt is already in confirmed phase', () => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');
			node.moveAgreementAttemptToConfirmPhase(agreementAttempt);

			const result = confirmHandler.tryToMoveToConfirmPhase(
				node,
				agreementAttempt
			);

			assert.strictEqual(result, false);
		});

		it('should fail if another agreement attempt is in accepted or confirmed phase', () => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');
			const otherAgreementAttempt = node.startNewAgreementAttempt('statement2');

			node.moveAgreementAttemptToAcceptPhase(otherAgreementAttempt);

			const result = confirmHandler.tryToMoveToConfirmPhase(
				node,
				agreementAttempt
			);
			assert.strictEqual(result, false);
		});

		it('should fail if agreement attempt is not ratified', (test) => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');

			const vote1 = new Vote('statement', false, 'B');
			const vote2 = new Vote('statement', true, 'C');

			agreementAttempt.addPeerVote(vote1);
			agreementAttempt.addPeerVote(vote2);

			const containsQuorumForVSpy = test.mock.method(
				quorumService,
				'containsQuorumForV'
			);
			containsQuorumForVSpy.mock.mockImplementation(() => false);

			const result = confirmHandler.tryToMoveToConfirmPhase(
				node,
				agreementAttempt
			);
			assert.strictEqual(result, false);
			const calls = containsQuorumForVSpy.mock.calls;
			assert.strictEqual(calls.length, 1);
			assert.deepStrictEqual(calls[0].arguments, [
				node.quorumSet,
				['C'],
				node.peerQuorumSets
			]);
		});
	});
});
