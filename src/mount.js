const rootMountedContext = {
	inDocument: false,
	children: new Map(),
	subscriptions: undefined,
	mountCallbacks: undefined,
	unmountCallbacks: undefined
};

let currentMountedContext = rootMountedContext;

window.rootMountedContext = rootMountedContext;

export function onMount( callback ) {
	const callbacks = currentMountedContext.mountCallbacks;
	callbacks.push( callback );
}

export function onUnmount( callback, context = currentMountedContext ) {
	const callbacks = context.unmountCallbacks;
	callbacks.push( callback );
}

export function registerSubscription( subscription ) {
	const subscriptions = currentMountedContext.subscriptions;
	subscriptions.push( subscription );
}

export function wrapCurrentMountedContext( callback ) {
	const mountedContext = currentMountedContext;
	return function() {
		const oldMountedContext = currentMountedContext;
		currentMountedContext = mountedContext;
		let returnValue = callback.apply( this, arguments );
		currentMountedContext = oldMountedContext;
		return returnValue;
	}
}

export function wrapNewMountedContext( callback ) {
	return function() {
		const parentMountedContext = currentMountedContext;
		currentMountedContext = {
			inDocument: false,
			children: new Map(),
			subscriptions: [],
			mountCallbacks: [],
			unmountCallbacks: []
		};

		const newElement = callback.apply( this, arguments );
		if( newElement !== undefined ) {
			if( newElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE ) {
				let currentNode = newElement.firstChild;
				while( currentNode && currentNode.nodeType !== Node.COMMENT_NODE ) {
					currentNode = currentNode.nextSibling;
				}
				parentMountedContext.children.set( newElement.firstChild, currentMountedContext );
			}
			parentMountedContext.children.set( newElement, currentMountedContext );
		}
		
		currentMountedContext = parentMountedContext;

		return newElement;
	}
}

// TODO what if it never gets mounted?  do the streams leak?
export function mountElement( parentNode, element, markerNode ) {
	let contextToMount = currentMountedContext.children.get( element );
	if( contextToMount === undefined ) {
		contextToMount = rootMountedContext.children.get( element )
		if( contextToMount !== undefined ) {
			if( element.nodeType === Node.DOCUMENT_FRAGMENT_NODE ) {
				rootMountedContext.children.delete( element );
				parentContext.children.set( element.firstChild, contextToMount );
			}
			else {
				currentMountedContext.children.set( element, contextToMount );
			}
		}
	}
	
	if( contextToMount !== undefined && element.nodeType === Node.DOCUMENT_FRAGMENT_NODE ) {
		currentMountedContext.children.delete( element );
		currentMountedContext.children.set( element.firstChild, contextToMount );
	}
	
	if( markerNode ) {
		parentNode.insertBefore( element, markerNode );
	}
	else {
		parentNode.appendChild( element );
	}
	
	if( contextToMount !== undefined ) {
		doMount( contextToMount );
	}
}

function doMount( context ) {
	if( context.inDocument ) {
		return;
	}
	
	context.inDocument = true;
	
	for( const callback of context.mountCallbacks ) {
		const unmountCallback = callback();
		if( typeof unmountCallback === "function" ) {
			onUnmount( unmountCallback, context );
		}
	}
	// TODO
	context.mountCallbacks = [];
	
	for( const childContext of context.children.values() ) {
		doMount( childContext );
	}
}

export function unmountElement( element ) {
	const contextToUnmount = currentMountedContext.children.get( element );
	if( contextToUnmount !== undefined ) {
		doUnmount( contextToUnmount );
		currentMountedContext.children.delete( element );
	}
}

function doUnmount( context ) {
	for( const subscription of context.subscriptions ) {
		subscription.unsubscribe();
	}
	context.subscriptions = [];

	for( const callback of context.unmountCallbacks ) {
		callback();
	}
	context.unmountCallbacks = [];

	for( const childContext of context.children.values() ) {
		doUnmount( childContext );
	}
	context.children = new Map();
}

