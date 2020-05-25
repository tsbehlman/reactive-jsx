import makeChildNode from "./makeChildNode.js";
import { subscribeForDOM, isObservable } from "./observableUtils.js";

export function Fragment( props, children ) {
	const fragment = document.createDocumentFragment();
	for( const child of children ) {
		fragment.appendChild( makeChildNode( child ) );
	}
	return fragment;
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
