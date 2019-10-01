import makeChildNode from "./make-child-node.js";

export function Fragment( props, children ) {
	const fragment = document.createDocumentFragment();
	for( const child of children ) {
		fragment.appendChild( makeChildNode( child ) );
	}
	return fragment;
}

export function Text( { nodeValue = "" }, children ) {
	if( nodeValue instanceof most.Stream ) {
		const node = document.createTextNode( "" );
		nodeValue.observe( value => node.nodeValue = value );
		return node;
	}
	else {
		return document.createTextNode( nodeValue );
	}
}
