import { wrapObservable } from "./observableUtils.js";

export function makeMountContext() {
	return {
		inDocument: false,
		parentContext: null,
		childContexts: new Set(),
		mount: {
			subscriptions: [],
			callbacks: []
		},
		unmount: {
			subscriptions: [],
			callbacks: []
		}
	};
}

const rootMountedContext = makeMountContext();
rootMountedContext.inDocument = true;

let currentMountedContext = rootMountedContext;

export function onMount( callback ) {
	currentMountedContext.mount.callbacks.push( callback );
}

export function onUnmount( callback, context = currentMountedContext ) {
	context.unmount.callbacks.push( callback );
}

export function subscribeForDOM( next, observable ) {
	currentMountedContext.mount.subscriptions.push( [ next, wrapObservable( observable ) ] );
}

export function wrapMountContext( context, callback ) {
	return function() {
		currentMountedContext.childContexts.add( context );
		context.parentContext = currentMountedContext;
		const oldMountedContext = currentMountedContext;
		currentMountedContext = context;
		let returnValue = callback.apply( this, arguments );
		currentMountedContext = oldMountedContext;
		return returnValue;
	}
}

export function wrapCurrentMountContext( callback ) {
	const context = currentMountedContext;
	return function() {
		const oldMountedContext = currentMountedContext;
		currentMountedContext = context;
		let returnValue = callback.apply( this, arguments );
		currentMountedContext = oldMountedContext;
		return returnValue;
	}
}

export function doMount( context ) {
	if( context.mount === null || !context.parentContext.inDocument ) {
		return;
	}
	
	context.inDocument = true;
	
	const { callbacks, subscriptions } = context.mount;
	context.mount = null;
	
	for( const callback of callbacks ) {
		const unmountCallback = callback();
		if( typeof unmountCallback === "function" ) {
			onUnmount( unmountCallback, context );
		}
	}
	
	for( const [ next, observable ] of subscriptions ) {
		const subscription = observable[ Symbol.observable ]().subscribe( {
			next,
			error: function reactiveMountError( error ) {
				console.error( "Uncaught observable error", error );
			},
			complete: function reactiveMountComplete() {
				subscription.unsubscribe();
			}
		} );
		context.unmount.subscriptions.push( subscription );
	}
	
	for( const childContext of context.childContexts ) {
		doMount( childContext );
	}
}

export function doUnmount( context ) {
	const { callbacks, subscriptions } = context.unmount;
	context.unmount = null;
	
	for( const subscription of subscriptions ) {
		subscription.unsubscribe();
	}

	for( const callback of callbacks ) {
		callback();
	}

	for( const childContext of context.childContexts ) {
		doUnmount( childContext );
	}
	context.childContexts.clear();
	
	context.parentContext.childContexts.delete( context );
}
