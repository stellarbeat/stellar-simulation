import { Simulation } from './Simulation';

export { Node } from './protocol/federated-voting/Node';
export { Simulation } from './Simulation';
export { Statement } from './protocol/federated-voting/Statement';

export type PublicKey = string;

const simulation = new Simulation();

simulation.setup();
