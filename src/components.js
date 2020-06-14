import { subscribeForDOM, isObservable } from "./observableUtils.js";

export function Fragment( props, children ) {
	return children;
}

export function Text( { nodeValue = "" }, children ) {
	if( isObservable( nodeValue ) ) {
		const node = document.createTextNode( "" );
		subscribeForDOM( value => node.nodeValue = value, nodeValue );
		return node;
	}
	else {
		return document.createTextNode( nodeValue );
	}
}
