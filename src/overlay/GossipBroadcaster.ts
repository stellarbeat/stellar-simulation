import { PublicKey } from '..';
import { OverlayNetwork } from './OverlayNetwork';

export interface GossipBroadcastState {
	processedNodes: Set<string>;
	nodesToProcess: string[];
}

export interface GossipBroadcastStepResult {
	state: GossipBroadcastState;
	connectionsUsed: [PublicKey, PublicKey][];
}

export class GossipBroadcaster {
	initializeBroadcast(sourceNode: PublicKey): GossipBroadcastState {
		return {
			processedNodes: new Set<string>(),
			nodesToProcess: [sourceNode]
		};
	}

	//overlay could change between steps? Better to pass it here than through state
	performBroadcastStep(
		overlay: OverlayNetwork,
		state: GossipBroadcastState
	): GossipBroadcastStepResult {
		if (state.nodesToProcess.length === 0) {
			return { state, connectionsUsed: [] };
		}

		const nextNodesToProcess: PublicKey[] = [];
		const connectionsUsed: [PublicKey, PublicKey][] = [];

		state.nodesToProcess.forEach((currentNode) => {
			overlay.getNeighbours(currentNode).forEach((neighbor) => {
				if (!state.processedNodes.has(neighbor)) {
					state.processedNodes.add(neighbor);
					nextNodesToProcess.push(neighbor);
					connectionsUsed.push([currentNode, neighbor]);
				}
			});
		});

		state.nodesToProcess = nextNodesToProcess;

		return {
			state,
			connectionsUsed
		};
	}

	hasPendingBroadcast(state: GossipBroadcastState): boolean {
		return state.nodesToProcess.length > 0;
	}
}
