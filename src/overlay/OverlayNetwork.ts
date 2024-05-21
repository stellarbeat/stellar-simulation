import assert from 'assert';
import { PublicKey } from '..';

export class Connection {
	private constructor(
		public readonly source: PublicKey,
		public readonly target: PublicKey
	) {}

	equals(connection: Connection): boolean {
		return (
			(connection.source === this.source ||
				connection.source === this.target) &&
			(connection.target === this.source || connection.target === this.target)
		);
	}

	static create(source: PublicKey, target: PublicKey): Connection {
		//no self loops
		assert(source !== target);

		return new Connection(source, target);
	}
}

//undirected graph
export class OverlayNetwork {
	private _nodes: Set<PublicKey> = new Set();
	private _connections: Set<Connection> = new Set(); //undirectional graph

	constructor(nodes: Set<PublicKey>, connections: Set<Connection>) {
		this._nodes = nodes;
		this._connections = connections;
	}

	public addNode(node: PublicKey): void {
		this._nodes.add(node);
	}

	public removeNode(publicKey: string): void {
		this._nodes.delete(publicKey);
		Array.from(this._connections).forEach((connection) => {
			if (connection.source === publicKey || connection.target === publicKey)
				this._connections.delete(connection);
		});
	}

	public addConnection(connection: Connection): void {
		if (
			Array.from(this._connections).filter((myConnection) => {
				myConnection.equals(connection);
			}).length > 0
		)
			return;

		this._connections.add(connection);
	}

	public getConnectedNodes(node: PublicKey): PublicKey[] {
		return Array.from(this._connections)
			.filter((connection) => {
				connection.source === node || connection.target === node;
			})
			.map((connection) => {
				return connection.source === node
					? connection.target
					: connection.source;
			});
	}

	public get connections(): Connection[] {
		return Array.from(this._connections);
	}

	public get nodes(): PublicKey[] {
		return Array.from(this._nodes);
	}
}
