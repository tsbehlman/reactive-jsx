let currentCleanupContext = {
	children: new Map(),
	subscriptions: undefined,
	callbacks: undefined
};

export function cleanup( cleanupFunction ) {
	const callbacks = currentCleanupContext.callbacks;
	callbacks && callbacks.push( cleanupFunction );
}

export function cleanupSubscription( subscription ) {
	const subscriptions = currentCleanupContext.subscriptions;
	subscriptions && subscriptions.push( subscription );
}

export function withCurrentCleanupContext( callback ) {
	const cleanupContext = currentCleanupContext;
	return function() {
		const oldCleanupContext = currentCleanupContext;
		currentCleanupContext = cleanupContext;
		callback.apply( this, arguments );
		currentCleanupContext = oldCleanupContext;
	}
}

export function withNewCleanupContext( callback ) {
	return function() {
		const parentCleanupContext = currentCleanupContext;
		currentCleanupContext = {
			children: new Map(),
			subscriptions: [],
			callbacks: []
		};
		
		const newElement = callback.apply( this, arguments );
		
		parentCleanupContext.children.set( newElement, currentCleanupContext );
		currentCleanupContext = parentCleanupContext;
		
		return newElement;
	}
}

export function cleanupElement( element ) {
	cleanupContext( currentCleanupContext.children.get( element ) );
	currentCleanupContext.children.delete( element );
}

function cleanupContext( context ) {
	for( const subscription of context.subscriptions ) {
		subscription.unsubscribe();
	}
	
	for( const callback of context.callbacks ) {
		callback();
	}
	
	for( const childContext of context.children.values() ) {
		cleanupCleanupContext( childContext );
	}
}
