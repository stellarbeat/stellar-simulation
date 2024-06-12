import { describe, it } from 'node:test';
import { Node } from '../../../../src';
import assert from 'node:assert';
import {
	AgreementAttempt,
	AgreementAttemptPhase
} from '../../../../src/federated-voting/agreement-attempt/AgreementAttempt';
import { QuorumSet } from '../../../../src/federated-voting/QuorumSet';

describe('AgreementAttempt', () => {
	const setupNode = (nodeId: string) => {
		return new Node(nodeId, new QuorumSet(1, ['B'], []));
	};

	describe('tryAccept', () => {
		it('should fail if agreement attempt is not in unknown phase', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');
			const isSetVBlockingSpy = test.mock.method(
				node.quorumSet,
				'isSetVBlocking'
			); //to make sure it's the status of the agreement attempt that causes the fail

			isSetVBlockingSpy.mock.mockImplementation(() => true);

			agreementAttempt.phase = AgreementAttemptPhase.accepted;

			assert.strictEqual(agreementAttempt.tryMoveToAcceptPhase(), false);

			agreementAttempt.phase = AgreementAttemptPhase.confirmed;
			assert.strictEqual(agreementAttempt.tryMoveToAcceptPhase(), false);
		});

		it('should accept if a v-blocking set of nodes has accepted the statement', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			agreementAttempt.addVotedToAcceptStatement(
				'B',
				new QuorumSet(1, ['c'], [])
			);
			agreementAttempt.addVotedToAcceptStatement(
				'C',
				new QuorumSet(1, ['B'], [])
			);
			agreementAttempt.addVotedForStatement('D', new QuorumSet(1, ['B'], []));

			const isSetVBlockingSpy = test.mock.method(
				node.quorumSet,
				'isSetVBlocking'
			);

			isSetVBlockingSpy.mock.mockImplementation(() => true);

			assert.strictEqual(agreementAttempt.tryMoveToAcceptPhase(), true);
			const spyCalls = isSetVBlockingSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [['B', 'C']]);
			assert.strictEqual(agreementAttempt.phase, 'accepted');
		});

		it('should fail if no v-blocking set of nodes has accepted the statement and no quorum has ratified it', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			agreementAttempt.addVotedToAcceptStatement(
				'B',
				new QuorumSet(1, ['c'], [])
			);
			agreementAttempt.addVotedForStatement('C', new QuorumSet(1, ['B'], []));
			agreementAttempt.addVotedForStatement('D', new QuorumSet(1, ['B'], []));

			const isSetVBlockingSpy = test.mock.method(
				node.quorumSet,
				'isSetVBlocking'
			);
			isSetVBlockingSpy.mock.mockImplementation(() => false);

			test.mock.method(node, 'isQuorum').mock.mockImplementation(() => null);

			assert.strictEqual(agreementAttempt.tryMoveToAcceptPhase(), false);
			const spyCalls = isSetVBlockingSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepStrictEqual(spyCalls[0].arguments, [['B']]); //only B and C have accepted
			assert.strictEqual(agreementAttempt.phase, 'unknown');
		});

		it('should accept if no v-blocking set of nodes has accepted the statement but a quorum has ratified it', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			const quorumSetOfB = new QuorumSet(1, ['c'], []);
			agreementAttempt.addVotedToAcceptStatement('B', quorumSetOfB);
			const quorumSetOfC = new QuorumSet(1, ['B'], []);
			agreementAttempt.addVotedForStatement('C', quorumSetOfC);
			const quorumSetOfD = new QuorumSet(1, ['B'], []);
			agreementAttempt.addVotedForStatement('D', quorumSetOfD);

			test.mock
				.method(node.quorumSet, 'isSetVBlocking')
				.mock.mockImplementation(() => false);

			const containsQuorumForVSpy = test.mock.method(node, 'isQuorum');
			containsQuorumForVSpy.mock.mockImplementation(() => ['B', 'C']);

			assert.strictEqual(agreementAttempt.tryMoveToAcceptPhase(), true);
			const spyCalls = containsQuorumForVSpy.mock.calls;
			assert.strictEqual(spyCalls.length, 1);
			assert.deepEqual(spyCalls[0].arguments, [
				new Map([
					['B', quorumSetOfB],
					['C', quorumSetOfC],
					['D', quorumSetOfD]
				])
			]);
			assert.strictEqual(agreementAttempt.phase, 'accepted');
		});
	});
	describe('tryToMoveToConfirmPhase', () => {
		it('should fail if agreement attempt is already in confirmed phase', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');
			agreementAttempt.phase = AgreementAttemptPhase.confirmed;
			const isQuorumSpy = test.mock.method(node, 'isQuorum');
			isQuorumSpy.mock.mockImplementation(() => ['A']);

			assert.strictEqual(agreementAttempt.tryMoveToConfirmPhase(), false);
			assert.strictEqual(agreementAttempt.phase, 'confirmed');
		});

		it('should fail if agreement attempt is not ratified', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			const quorumSetOfB = new QuorumSet(1, ['c'], []);
			agreementAttempt.addVotedForStatement('B', quorumSetOfB);
			const quorumSetOfC = new QuorumSet(1, ['B'], []);
			agreementAttempt.addVotedToAcceptStatement('C', quorumSetOfC);

			const isQuorumSpy = test.mock.method(node, 'isQuorum');
			isQuorumSpy.mock.mockImplementation(() => null);

			assert.strictEqual(agreementAttempt.tryMoveToConfirmPhase(), false);
			const calls = isQuorumSpy.mock.calls;
			assert.strictEqual(calls.length, 1);
			assert.deepEqual(calls[0].arguments, [new Map([['C', quorumSetOfC]])]);
			assert.strictEqual(agreementAttempt.phase, 'unknown');
		});

		it('should move to confirm phase if agreement attempt is ratified', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');

			agreementAttempt.addVotedToAcceptStatement(
				'B',
				new QuorumSet(1, ['c'], [])
			);
			agreementAttempt.addVotedToAcceptStatement(
				'C',
				new QuorumSet(1, ['B'], [])
			);

			const isQuorumSpy = test.mock.method(node, 'isQuorum');
			isQuorumSpy.mock.mockImplementation(() => true);

			assert.strictEqual(agreementAttempt.tryMoveToConfirmPhase(), true);
			const calls = isQuorumSpy.mock.calls;
			assert.strictEqual(calls.length, 1);

			assert.strictEqual(agreementAttempt.phase, 'confirmed');
		});
	});
});
