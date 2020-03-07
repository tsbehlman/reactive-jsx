function makeChildObserver( start, end ) {
	return function childObserver( streamValue ) {
		if( !Array.isArray( streamValue ) ) {
			streamValue = [ streamValue ];
		}

		const valueIterator = streamValue[ Symbol.iterator ]();
		let { done, value } = valueIterator.next();

		const parent = start.parentNode;
		let oldElement = start.nextSibling;

		while( !done && oldElement !== end ) {
			oldElement = replaceNodeWithChild( parent, value, oldElement ).nextSibling;
			( { done, value } = valueIterator.next() );
		}

		while( !done ) {
			const newElement = makeChildNode( value );
			parent.insertBefore( newElement, end );
			( { done, value } = valueIterator.next() );
		}

		while( oldElement !== end ) {
			const nextElement = oldElement.nextSibling;
			parent.removeChild( oldElement );
			oldElement = nextElement;
		}
	};
}

function replaceNodeWithChild( parent, newChild, oldNode ) {
	let newNode = oldNode;
	if( newChild !== oldNode ) {
		if( newChild instanceof Node || newChild instanceof most.Stream || oldNode.nodeType !== Node.TEXT_NODE ) {
			newNode = makeChildNode( newChild );
			parent.replaceChild( newNode, oldNode );
		}
		else {
			oldNode.nodeValue = newChild;
		}
	}
	return newNode;
}

export default function makeChildNode( child ) {
	if( child instanceof Node ) {
		return child;
	}
	else if( child instanceof most.Stream ) {
		const fragment = document.createDocumentFragment();
		const start = document.createComment( "/\\" );
		const end = document.createComment( "\\/" );
		fragment.appendChild( start );
		fragment.appendChild( end );
		child.observe( makeChildObserver( start, end ) );
		return fragment;
	}
	else {
		return document.createTextNode( child );
	}
}
