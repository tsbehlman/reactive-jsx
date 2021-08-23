import { subscribeForDOM, isObservable } from "./observableUtils.js";
import { applyRef } from "./ref.js";

export function Text( { nodeValue = "", ref }, children ) {
	if( isObservable( nodeValue ) ) {
		const node = document.createTextNode( "" );
		subscribeForDOM( value => node.nodeValue = value, nodeValue );
		applyRef( node, ref );
		return node;
	}
	else {
		const node = document.createTextNode( nodeValue );
		applyRef( node, ref );
		return node;
	}
}
