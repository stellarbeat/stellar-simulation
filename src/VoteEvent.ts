import { PublicKey } from './PublicKey';
import { Event } from './Message';
import { Vote } from './protocol/federated-voting/Vote';

export class VoteEvent implements Event {
	//sender can differ from the voter.
	//Confirming that the voting node actually constructed the vote should be handled with public key encryption
	//This is not implemented for simplicity (at the moment?)
	constructor(public readonly sender: PublicKey, public readonly vote: Vote) {
		super(sender);
	}
}
