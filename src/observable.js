import { makeObservable, subscribe } from "./observableUtils.js";

export function tap( sideEffect, source ) {
	const [ sink, dispatch ] = makeObservable( function() {
		const subscription = subscribe( function tapCallback( value ) {
			sideEffect( value )
			dispatch( value );
		}, source );
		
		return subscription.unsubscribe();
	} );

	return sink;
}

export function map( mapper, source ) {
	const [ sink, dispatch ] = makeObservable( function() {
		const subscription = subscribe( function mapCallback( value ) {
			dispatch( mapper( value ) );
		}, source );
		
		return () => subscription.unsubscribe();
	} );
	
	return sink;
}

export function filter( filterer, source ) {
	const [ sink, dispatch ] = makeObservable( function() {
		const subscription = subscribe( function filterCallback( value ) {
			if( filterer( value ) ) {
				dispatch( value );
			}
		}, source );
		
		return () => subscription.unsubscribe();
	} );
	
	return sink;
}

export function sampleWith( sampler, source ) {
	const [ sink, dispatch ] = makeObservable( function() {
		let sourceValue;
		
		const sourceSubscription = subscribe( function sampleCallback( value ) {
			sourceValue = value;
		}, source );
		
		const samplerSubscription = subscribe( function sampleWithCallback() {
			dispatch( sourceValue );
		}, sampler );
		
		return () => {
			sourceSubscription.unsubscribe();
			samplerSubscription.unsubscribe();
		};
	} );
	
	return sink;
}

export function combine( combiner, source1, source2 ) {
	return combineArray( combiner, [ source1, source2 ] );
}

export function combineArray( combiner, sources ) {
	let dispatchBuffer = undefined;
	
	const [ sink, dispatch ] = makeObservable( function() {
		const subscriptions = [];
		const values = [];
		
		for( let i = 0; i < sources.length; i++ ) {
			subscriptions[ i ] = subscribe( function combineArrayCallback( value ) {
				if( values[ i ] === value ) {
					return;
				}
				values[ i ] = value;
				if( dispatchBuffer === undefined && values.length === sources.length ) {
					dispatchBuffer = Promise.resolve().then( () => {
						dispatch( combiner( ...values ) );
						dispatchBuffer = undefined;
					} );
				}
			}, sources[ i ] );
		}
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
	
	dispatch( [] );
	
	return sink;
}

export function merge( source1, source2 ) {
	return mergeArray( [ source1, source2 ] );
}

export function mergeArray( sources ) {
	const [ sink, dispatch ] = makeObservable( function() {
		const subscriptions = sources.map( source => subscribe( dispatch, source ) );
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
	
	return sink;
}

export function switchLatest( source ) {
	const [ sink, dispatch ] = makeObservable( function() {
		let currentSubscription;
		
		const sourceSubscription = subscribe( function switchLatestCallback( newSource ) {
			currentSubscription && currentSubscription.unsubscribe();
			currentSubscription = subscribe( dispatch, newSource );
		}, source );
		
		return () => {
			currentSubscription && currentSubscription.unsubscribe();
			subscription.unsubscribe();
		};
	} );
	
	return sink;
}

export { subscribe } from "./observableUtils.js";
