import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Node } from '../../../../src';
import { QuorumService } from '../../../../src/node/services/QuorumService';
import { ConfirmPhaseEvaluator } from '../../../../src/node/federated-voting/agreement-attempt/ConfirmPhaseEvaluator';
import { AgreementAttempt } from '../../../../src/node/federated-voting/agreement-attempt/AgreementAttempt';
import { AgreementAttemptCollection } from '../../../../src/node/federated-voting/agreement-attempt/AgreementAttemptCollection';

describe('ConfirmPhaseEvaluator', () => {
	const setupNode = (nodeId: string) => {
		return new Node(nodeId, {
			threshold: 1,
			validators: ['B'],
			innerQSets: []
		});
	};
	const quorumService = new QuorumService();
	const confirmPhaseEvaluator = new ConfirmPhaseEvaluator(quorumService);

	describe('tryToMoveToConfirmPhase', () => {
		it('should fail if agreement attempt is already in confirmed phase', () => {
			const node = setupNode('A');
			const agreementAttemptCollection = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttempt.phase = 'confirmed';
			agreementAttemptCollection.add(agreementAttempt);

			const result = confirmPhaseEvaluator.canMoveToConfirmPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
			);

			assert.strictEqual(result, false);
		});

		it('should fail if another agreement attempt is in accepted or confirmed phase', () => {
			const node = setupNode('A');
			const agreeementAttemptCollection = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			const otherAgreementAttempt = AgreementAttempt.create('statement2');
			otherAgreementAttempt.phase = 'accepted';
			agreeementAttemptCollection.add(agreementAttempt);
			agreeementAttemptCollection.add(otherAgreementAttempt);

			const result = confirmPhaseEvaluator.canMoveToConfirmPhase(
				agreementAttempt,
				agreeementAttemptCollection,
				node
			);
			assert.strictEqual(result, false);
		});

		it('should fail if agreement attempt is not ratified', (test) => {
			const node = setupNode('A');
			const agreementAttemptCollection = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttemptCollection.add(agreementAttempt);

			agreementAttempt.addPeerThatVotedForStatement('B');
			agreementAttempt.addPeerThatVotedToAcceptStatement('C');

			const containsQuorumForVSpy = test.mock.method(
				quorumService,
				'containsQuorumForV'
			);
			containsQuorumForVSpy.mock.mockImplementation(() => false);

			const result = confirmPhaseEvaluator.canMoveToConfirmPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
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

		it('should move to confirm phase if agreement attempt is ratified', (test) => {
			const node = setupNode('A');
			const agreementAttemptCollection = new AgreementAttemptCollection();
			const agreementAttempt = AgreementAttempt.create('statement');
			agreementAttemptCollection.add(agreementAttempt);

			agreementAttempt.addPeerThatVotedToAcceptStatement('B');
			agreementAttempt.addPeerThatVotedToAcceptStatement('C');

			const containsQuorumForVSpy = test.mock.method(
				quorumService,
				'containsQuorumForV'
			);
			containsQuorumForVSpy.mock.mockImplementation(() => true);

			const result = confirmPhaseEvaluator.canMoveToConfirmPhase(
				agreementAttempt,
				agreementAttemptCollection,
				node
			);

			assert.strictEqual(result, true);
		});
	});
});
