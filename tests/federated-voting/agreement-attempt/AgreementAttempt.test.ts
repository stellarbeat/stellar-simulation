import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
	AcceptVoteRatified,
	Node,
	QuorumSet,
	Statement,
	VoteRatified
} from '../../../src/federated-voting';
import { AgreementAttempt } from '../../../src/federated-voting';
import { AgreementAttemptPhase } from '../../../src/federated-voting/agreement-attempt/AgreementAttempt';
import { Event } from '../../../src/core/Event';
import { AcceptVoteVBlocked } from '../../../src/federated-voting/agreement-attempt/event/AcceptVoteVBlocked';
import { AgreementAttemptMovedToAcceptPhase } from '../../../src/federated-voting/agreement-attempt/event/AgreementAttemptMovedToAcceptPhase';
import { AgreementAttemptMovedToConfirmPhase } from '../../../src/federated-voting/agreement-attempt/event/AgreementAttemptMovedToConfirmPhase';

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

			assert.strictEqual(agreementAttempt.drainEvents().length, 0);
		});

		const assertAcceptVoteVBlockedEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			vBlockingSet: Set<string>
		) => {
			assert.strictEqual(event instanceof AcceptVoteVBlocked, true);
			if (event instanceof AcceptVoteVBlocked) {
				assert.strictEqual(event.statement, statement);
				assert.strictEqual(event.publicKey, publicKey);
				assert.deepStrictEqual(event.vBlockingSet, vBlockingSet);
			}
		};

		const assertVoteRatifiedEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			quorum: string[]
		) => {
			assert.strictEqual(event instanceof VoteRatified, true);
			if (event instanceof VoteRatified) {
				assert.strictEqual(event.statement, statement);
				assert.strictEqual(event.publicKey, publicKey);
				assert.deepEqual(event.quorum, quorum);
			}
		};

		const assertAgreementAttemptMovedToAcceptPhaseEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			phase: AgreementAttemptPhase
		) => {
			assert.strictEqual(
				event instanceof AgreementAttemptMovedToAcceptPhase,
				true
			);
			if (event instanceof AgreementAttemptMovedToAcceptPhase) {
				assert.strictEqual(event.statement, statement);
				assert.strictEqual(event.agreementAttemptPhase, phase);
				assert.strictEqual(event.publicKey, publicKey);
			}
		};

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

			const events = agreementAttempt.drainEvents();
			assert.strictEqual(events.length, 2);
			assertAcceptVoteVBlockedEvent(
				events[0],
				'statement',
				'A',
				new Set(['B', 'C'])
			);

			assertAgreementAttemptMovedToAcceptPhaseEvent(
				events[1],
				'statement',
				'A',
				AgreementAttemptPhase.accepted
			);
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

			assert.strictEqual(agreementAttempt.drainEvents().length, 0);
		});

		it('should accept if no v-blocking set of nodes has accepted the statement but a quorum has voted for it', (test) => {
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

			const events = agreementAttempt.drainEvents();
			assert.strictEqual(events.length, 2);
			assertVoteRatifiedEvent(events[0], 'statement', 'A', ['B', 'C']);
			assertAgreementAttemptMovedToAcceptPhaseEvent(
				events[1],
				'statement',
				'A',
				AgreementAttemptPhase.accepted
			);
		});
	});
	describe('tryToMoveToConfirmPhase', () => {
		const assertAcceptVoteRatifiedEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			quorum: Map<string, QuorumSet>
		) => {
			assert.strictEqual(event instanceof AcceptVoteRatified, true);
			if (event instanceof AcceptVoteRatified) {
				assert.strictEqual(event.statement, statement);
				assert.strictEqual(event.publicKey, publicKey);
				assert.deepEqual(event.quorum, quorum);
			}
		};

		const assertAgreementAttemptMovedToConfirmPhaseEvent = (
			event: Event,
			statement: Statement,
			publicKey: string,
			phase: AgreementAttemptPhase
		) => {
			assert.strictEqual(
				event instanceof AgreementAttemptMovedToConfirmPhase,
				true
			);
			if (event instanceof AgreementAttemptMovedToConfirmPhase) {
				assert.strictEqual(event.statement, statement);
				assert.strictEqual(event.agreementAttemptPhase, phase);
				assert.strictEqual(event.publicKey, publicKey);
			}
		};

		it('should fail if agreement attempt is already in confirmed phase', (test) => {
			const node = setupNode('A');
			const agreementAttempt = AgreementAttempt.create(node, 'statement');
			agreementAttempt.phase = AgreementAttemptPhase.confirmed;
			const isQuorumSpy = test.mock.method(node, 'isQuorum');
			isQuorumSpy.mock.mockImplementation(() => ['A']);

			assert.strictEqual(agreementAttempt.tryMoveToConfirmPhase(), false);
			assert.strictEqual(agreementAttempt.phase, 'confirmed');
			assert.strictEqual(isQuorumSpy.mock.calls.length, 0);

			assert.strictEqual(agreementAttempt.drainEvents().length, 0);
		});

		it('should fail if vote(accept) is not ratified', (test) => {
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

			assert.strictEqual(agreementAttempt.drainEvents().length, 0);
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
			isQuorumSpy.mock.mockImplementation(
				() => new Map([['C', new QuorumSet(1, ['B'], [])]])
			);

			assert.strictEqual(agreementAttempt.tryMoveToConfirmPhase(), true);
			const calls = isQuorumSpy.mock.calls;
			assert.strictEqual(calls.length, 1);

			assert.strictEqual(agreementAttempt.phase, 'confirmed');

			const events = agreementAttempt.drainEvents();
			assert.strictEqual(events.length, 2);

			assertAcceptVoteRatifiedEvent(
				events[0],
				'statement',
				'A',
				new Map([['C', new QuorumSet(1, ['B'], [])]])
			);

			console.log(events[1]);
			assertAgreementAttemptMovedToConfirmPhaseEvent(
				events[1],
				'statement',
				'A',
				AgreementAttemptPhase.confirmed
			);
		});
	});
});
