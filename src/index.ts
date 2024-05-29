import { Simulation } from './Simulation';

export { Node } from './node/federated-voting/Node';
export { Simulation } from './Simulation';
export { Statement } from './node/Statement';

export type PublicKey = string;

const simulation = new Simulation();

simulation.setup();
