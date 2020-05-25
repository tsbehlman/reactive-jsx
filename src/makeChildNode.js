import { subscribeForDOM, isObservable, recordSubscriptions, collectSubscriptions } from "./observableUtils.js";

function makeChildObserver( start, end ) {
	const subscriptionCache = new WeakMap();
	
	return function childObserver( streamValue ) {
		if( !Array.isArray( streamValue ) ) {
			streamValue = [ streamValue ];
		}

		const valueIterator = streamValue[ Symbol.iterator ]();
		let { done, value } = valueIterator.next();

		const parent = start.parentNode;
		let oldElement = start.nextSibling;

		while( !done && oldElement !== end ) {
			oldElement = replaceNodeWithChild( parent, value, oldElement, subscriptionCache ).nextSibling;
			( { done, value } = valueIterator.next() );
		}

		while( !done ) {
			const newElement = makeOptionalChildNode( value, subscriptionCache );
			parent.insertBefore( newElement, end );
			( { done, value } = valueIterator.next() );
		}

		while( oldElement !== end ) {
			const nextElement = oldElement.nextSibling;
			clearSubscriptions( oldElement, subscriptionCache );
			parent.removeChild( oldElement );
			oldElement = nextElement;
		}
	};
}

function replaceNodeWithChild( parent, newChild, oldNode, subscriptionCache ) {
	let newNode = oldNode;
	if( newChild !== oldNode ) {
		if( newChild instanceof Node || isObservable( newChild ) || oldNode.nodeType !== Node.TEXT_NODE ) {
			clearSubscriptions( oldNode, subscriptionCache );
			newNode = makeOptionalChildNode( newChild, subscriptionCache );
			parent.replaceChild( newNode, oldNode );
		}
		else {
			oldNode.nodeValue = newChild;
		}
	}
	return newNode;
}

function makeOptionalChildNode( child, subscriptionCache ) {
	recordSubscriptions();
	const newElement = makeChildNode( child );
	subscriptionCache.set( newElement, collectSubscriptions() );
	return newElement;
}

function clearSubscriptions( element, subscriptionCache ) {
	const subscriptions = subscriptionCache.get( element ) || [];
	for( const subscription of subscriptions ) {
		subscription.unsubscribe();
	}
}

export default function makeChildNode( child ) {
	if( child instanceof Node ) {
		return child;
	}
	else if( isObservable( child ) ) {
		const fragment = document.createDocumentFragment();
		const start = document.createComment( "" );
		const end = document.createComment( "" );
		fragment.appendChild( start );
		fragment.appendChild( end );
		subscribeForDOM( makeChildObserver( start, end ), child );
		return fragment;
	}
	else {
		return document.createTextNode( child );
	}
}
