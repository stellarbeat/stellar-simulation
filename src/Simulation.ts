import EventEmitter from 'events';
import { Event } from './Event';
import { EventBus } from './EventBus';
import { GossipBroadcaster } from './overlay/GossipBroadcaster';
import { Connection } from './overlay/Connection';
import { OverlayNetwork } from './overlay/OverlayNetwork';

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
	setup(): void {
		const broadCaster = new GossipBroadcaster();
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

		const overlay = new OverlayNetwork();
		overlay.addNodes(['A', 'B', 'C', 'D', 'E', 'F']);
		const connections = [
			Connection.create('A', 'B'),
			Connection.create('A', 'E'),
			Connection.create('C', 'B'),
			Connection.create('C', 'D'),
			Connection.create('E', 'F'),
			Connection.create('F', 'D')
		];
		overlay.addConnections(connections);

		let broadcastState = broadCaster.initializeBroadcast('A');
		while (broadCaster.hasPendingBroadcast(broadcastState)) {
			const result = broadCaster.performBroadcastStep(overlay, broadcastState);
			console.log(result.connectionsUsed);
			broadcastState = result.state;
		}
	}
}
