import { describe, it } from 'node:test';
import { AcceptPhaseEvaluator } from '../../../../src/node/federated-voting/agreement-attempt/AcceptPhaseEvaluator';
import { QuorumService } from '../../../../src/node/services/QuorumService';
import { VBlockingNodesDetector } from '../../../../src/node/services/VBlockingNodesDetector';
import { Node } from '../../../../src';
import assert from 'node:assert';
import { AgreementAttemptCollection } from '../../../../src/node/federated-voting/agreement-attempt/AgreementAttemptCollection';
import { AgreementAttempt } from '../../../../src/node/federated-voting/agreement-attempt/AgreementAttempt';

describe('AcceptPhaseEvaluator', () => {
	const quorumService = new QuorumService();
	const vBlockingNodesDetector = new VBlockingNodesDetector();

	const acceptHandler = new AcceptPhaseEvaluator(
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
			const agreementAttemptCollection = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttempt.phase = 'accepted';
			agreementAttemptCollection.add(agreementAttempt);

			const result = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
			);

			assert.strictEqual(result, false);

			agreementAttempt.phase = 'confirmed';
			const result2 = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
			);
			assert.strictEqual(result2, false);
		});

		it('should fail if another agreement attempt is not in unknown phase', () => {
			const node = setupNode('A');
			const agreementAttemptCollection = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttemptCollection.add(agreementAttempt);

			const otherAgreementAttempt = AgreementAttempt.create('statement2');
			otherAgreementAttempt.phase = 'accepted';
			agreementAttemptCollection.add(otherAgreementAttempt);

			const result = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
			);
			assert.strictEqual(result, false);

			otherAgreementAttempt.phase = 'confirmed';
			const result2 = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
			);
			assert.strictEqual(result2, false);
		});

		it('should accept if a v-blocking set of nodes has accepted the statement', (test) => {
			const node = setupNode('A');
			const agreementAttempts = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttempts.add(agreementAttempt);

			agreementAttempt.addVotedToAcceptStatement('B');
			agreementAttempt.addVotedToAcceptStatement('C');
			agreementAttempt.addVotedForStatement('D');

			const isSetVBlockingSpy = test.mock.method(
				vBlockingNodesDetector,
				'isSetVBlocking'
			);

			isSetVBlockingSpy.mock.mockImplementation(() => true);

			const result = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttempts,
				node
			);

			const spyCalls = isSetVBlockingSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [
				node.quorumSet,
				['B', 'C']
			]);
			assert.strictEqual(result, true);
		});

		it('should fail if a no v-blocking set of nodes has accepted the statement and no quorum has ratified it', (test) => {
			const node = setupNode('A');
			const agreementAttempts = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttempts.add(agreementAttempt);

			agreementAttempt.addVotedToAcceptStatement('B');
			agreementAttempt.addVotedForStatement('C');
			agreementAttempt.addVotedForStatement('D');

			const isSetVBlockingSpy = test.mock.method(
				vBlockingNodesDetector,
				'isSetVBlocking'
			);
			isSetVBlockingSpy.mock.mockImplementation(() => false);

			test.mock
				.method(quorumService, 'containsQuorumForV')
				.mock.mockImplementation(() => false);

			const result = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttempts,
				node
			);

			const spyCalls = isSetVBlockingSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [node.quorumSet, ['B']]); //only B and C have accepted
			assert.strictEqual(result, false);
		});

		it('should accept if no v-blocking set of nodes has accepted the statement but a quorum has ratified it', (test) => {
			const node = setupNode('A');
			const agreementAttempts = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttempts.add(agreementAttempt);

			agreementAttempt.addVotedToAcceptStatement('B');
			agreementAttempt.addVotedForStatement('C');
			agreementAttempt.addVotedForStatement('D');

			test.mock
				.method(vBlockingNodesDetector, 'isSetVBlocking')
				.mock.mockImplementation(() => false);

			const containsQuorumForVSpy = test.mock.method(
				quorumService,
				'containsQuorumForV'
			);
			containsQuorumForVSpy.mock.mockImplementation(() => true);

			const result = acceptHandler.canMoveToAcceptPhase(
				agreementAttempt,
				agreementAttempts,
				node
			);

			const spyCalls = containsQuorumForVSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepEqual(spyCalls[0].arguments, [
				node.quorumSet,
				['C', 'D', 'B'],
				node.peerQuorumSets
			]); //only B and C have accepted
			assert.strictEqual(result, true);
		});
	});
});
