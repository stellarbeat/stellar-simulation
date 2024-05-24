import EventEmitter from 'events';
import { Event } from './Event';
import { EventBus } from './EventBus';
import {
	GossipBroadcastState,
	GossipBroadcaster
} from './overlay/GossipBroadcaster';
import { Connection } from './overlay/Connection';
import { OverlayNetwork } from './overlay/OverlayNetwork';
import { QuorumSet } from './node/QuorumSet';
import { Node } from './node/Node';
import { FederatedVote } from './node/federated-voting/FederatedVote';
import { AcceptPhaseEvaluator } from './node/federated-voting/agreement-attempt/AcceptPhaseEvaluator';
import { StatementValidator } from './node/federated-voting/StatementValidator';
import { QuorumService } from './node/services/QuorumService';
import { VBlockingNodesDetector } from './node/services/VBlockingNodesDetector';
import { ConfirmPhaseEvaluator } from './node/federated-voting/agreement-attempt/ConfirmPhaseEvaluator';
import { PublicKey } from '.';

class MyEventBus implements EventBus {
	eventEmitter = new EventEmitter();

	emit(event: Event, payload?: Record<string, unknown>): void {
		this.eventEmitter.emit(event.toString(), payload);
	}

	on(event: Event, callback: (event: Event) => void): void {
		this.eventEmitter.on(event.toString(), callback);
	}

	off(event: Event): void {
		this.eventEmitter.off(event.toString(), () => {
			console.log('off');
		});
	}
}

export class Simulation {
	private broadCastStates = new Set<GossipBroadcastState>();
	private broadCaster = new GossipBroadcaster();

	private setupNode(
		nodeId: string,
		quorumSet: QuorumSet,
		quorumSets: Map<PublicKey, QuorumSet>
	): [Node, FederatedVote] {
		const node = new Node(nodeId, quorumSet);
		const statementValidator = new StatementValidator();
		const quorumService = new QuorumService();
		const vBlockingNodesDetector = new VBlockingNodesDetector();
		const acceptPhaseEvaluator = new AcceptPhaseEvaluator(
			vBlockingNodesDetector,
			quorumService
		);
		const confirmPhaseEvaluator = new ConfirmPhaseEvaluator(quorumService);
		const federatedVote = new FederatedVote(
			node,
			statementValidator,
			acceptPhaseEvaluator,
			confirmPhaseEvaluator,
			{}
		);
		node.peerQuorumSets = quorumSets;
		return [node, federatedVote];
	}

	setup(): void {
		/*const federatedVoting = new FederatedVoting(
			new StatementValidator(),
			new MyEventBus(),
			new AcceptHandler(new VBlockingNodesDetector(), new QuorumService()),
			new ConfirmHandler(new QuorumService())
		);*/

		/**       B --- C
		 *      /        \
		 * A ---          ---D
		 *      \        /
		 *       E ---- F
		 **/

		const quorumSet: QuorumSet = {
			threshold: 4,
			validators: ['A', 'B', 'C', 'D', 'E', 'F'],
			innerQSets: []
		};
		const quorumSets = new Map<string, QuorumSet>();
		quorumSets.set('A', quorumSet);
		quorumSets.set('B', quorumSet);
		quorumSets.set('C', quorumSet);
		quorumSets.set('D', quorumSet);
		quorumSets.set('E', quorumSet);
		quorumSets.set('F', quorumSet);

		const [nodeA, federatedVoteA] = this.setupNode('A', quorumSet, quorumSets);
		const [nodeB, federatedVoteB] = this.setupNode('B', quorumSet, quorumSets);
		const [nodeC, federatedVoteC] = this.setupNode('C', quorumSet, quorumSets);
		const [nodeD, federatedVoteD] = this.setupNode('D', quorumSet, quorumSets);
		const [nodeE, federatedVoteE] = this.setupNode('E', quorumSet, quorumSets);
		const [nodeF, federatedVoteF] = this.setupNode('F', quorumSet, quorumSets);

		const overlay = new OverlayNetwork();
		overlay.addNodes([
			nodeA.publicKey,
			nodeB.publicKey,
			nodeC.publicKey,
			nodeD.publicKey,
			nodeE.publicKey,
			nodeF.publicKey
		]);

		const connections = [
			Connection.create('A', 'B'),
			Connection.create('A', 'E'),
			Connection.create('C', 'B'),
			Connection.create('C', 'D'),
			Connection.create('E', 'F'),
			Connection.create('F', 'D')
		];
		overlay.addConnections(connections);

		const voteA = federatedVoteA.voteForStatement('pizza');
		const voteB = federatedVoteB.voteForStatement('pizza');
		const voteC = federatedVoteC.voteForStatement('pizza');
		const voteD = federatedVoteD.voteForStatement('pizza');
		const voteE = federatedVoteE.voteForStatement('burger');
		const voteF = federatedVoteF.voteForStatement('burger');

		this.broadCastStates.add(this.broadCaster.initializeBroadcast('A', voteA));
		this.broadCastStates.add(this.broadCaster.initializeBroadcast('B', voteB));
		this.broadCastStates.add(this.broadCaster.initializeBroadcast('C', voteC));
		this.broadCastStates.add(this.broadCaster.initializeBroadcast('D', voteD));
		this.broadCastStates.add(this.broadCaster.initializeBroadcast('E', voteE));
		this.broadCastStates.add(this.broadCaster.initializeBroadcast('F', voteF));

		while (this.hasPendingBroadcast()) {
			console.log('tick');
			this.performBroadcastStep(overlay);
		}
	}

	private hasPendingBroadcast() {
		return Array.from(this.broadCastStates).some((state) =>
			this.broadCaster.hasPendingBroadcast(state)
		);
	}

	private performBroadcastStep(overlay: OverlayNetwork) {
		const newBroadcastStates = new Set<GossipBroadcastState>();
		Array.from(this.broadCastStates).forEach((state) => {
			const result = this.broadCaster.performBroadcastStep(overlay, state);
			newBroadcastStates.add(result.state);
			result.connectionsUsed.forEach((connection) => {
				console.log(
					result.state.message +
						' sent from ' +
						connection[0] +
						' to ' +
						connection[1]
				);
			});
		});
		this.broadCastStates = newBroadcastStates;
	}
}

const simulation = new Simulation();
simulation.setup();
