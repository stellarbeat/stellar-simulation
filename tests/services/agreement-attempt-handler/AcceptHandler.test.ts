import { describe, it } from 'node:test';
import { AcceptHandler } from '../../../src/protocol/federated-voting/agreement-attempt-handler/AcceptHandler';
import { QuorumService } from '../../../src/services/QuorumService';
import { VBlockingNodesDetector } from '../../../src/services/VBlockingNodesDetector';
import { Node } from '../../../src';
import assert from 'node:assert';
import { Vote } from '../../../src/protocol/federated-voting/Vote';

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

		it('should accept if a v-blocking set of nodes has accepted the statement', (test) => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');

			const peerNodeBVote = new Vote('statement', true, 'B');
			const peerNodeCVote = new Vote('statement', true, 'C');
			const peerNodeDVote = new Vote('statement', false, 'D');

			agreementAttempt.addPeerVote(peerNodeBVote);
			agreementAttempt.addPeerVote(peerNodeCVote);
			agreementAttempt.addPeerVote(peerNodeDVote);

			const isSetVBlockingSpy = test.mock.method(
				vBlockingNodesDetector,
				'isSetVBlocking'
			);

			isSetVBlockingSpy.mock.mockImplementation(() => true);

			const result = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);

			const spyCalls = isSetVBlockingSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [
				node.quorumSet,
				['B', 'C']
			]);
			assert.strictEqual(result, true);
			assert.strictEqual(agreementAttempt.phase, 'accepted');
		});

		it('should fail if a no v-blocking set of nodes has accepted the statement and no quorum has ratified it', (test) => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');

			const peerNodeBVote = new Vote('statement', true, 'B');
			const peerNodeCVote = new Vote('statement', false, 'C');
			const peerNodeDVote = new Vote('statement', false, 'D'); //not accepted

			agreementAttempt.addPeerVote(peerNodeBVote);
			agreementAttempt.addPeerVote(peerNodeCVote);
			agreementAttempt.addPeerVote(peerNodeDVote);

			const isSetVBlockingSpy = test.mock.method(
				vBlockingNodesDetector,
				'isSetVBlocking'
			);
			isSetVBlockingSpy.mock.mockImplementation(() => false);

			test.mock
				.method(quorumService, 'containsQuorumForV')
				.mock.mockImplementation(() => false);

			const result = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);

			const spyCalls = isSetVBlockingSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [node.quorumSet, ['B']]); //only B and C have accepted
			assert.strictEqual(result, false);
		});

		it('should accept if no v-blocking set of nodes has accepted the statement but a quorum has ratified it', (test) => {
			const node = setupNode('A');
			const agreementAttempt = node.startNewAgreementAttempt('statement');

			const peerNodeBVote = new Vote('statement', true, 'B');
			const peerNodeCVote = new Vote('statement', false, 'C');
			const peerNodeDVote = new Vote('statement', false, 'D'); //not accepted

			agreementAttempt.addPeerVote(peerNodeBVote);
			agreementAttempt.addPeerVote(peerNodeCVote);
			agreementAttempt.addPeerVote(peerNodeDVote);

			test.mock
				.method(vBlockingNodesDetector, 'isSetVBlocking')
				.mock.mockImplementation(() => false);

			const containsQuorumForVSpy = test.mock.method(
				quorumService,
				'containsQuorumForV'
			);
			containsQuorumForVSpy.mock.mockImplementation(() => true);

			const result = acceptHandler.tryToMoveToAcceptPhase(
				node,
				agreementAttempt
			);

			const spyCalls = containsQuorumForVSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [
				node.quorumSet,
				['B', 'C', 'D'],
				node.peerQuorumSets
			]); //only B and C have accepted
			assert.strictEqual(result, true);
			assert.strictEqual(agreementAttempt.phase, 'accepted');
		});
	});
});
