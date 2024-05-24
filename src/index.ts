import { Simulation } from './Simulation';

export { Node } from './node/Node';
export { Simulation } from './Simulation';
export { Statement } from './node/federated-voting/Statement';

export type PublicKey = string;

const simulation = new Simulation();

simulation.setup();
