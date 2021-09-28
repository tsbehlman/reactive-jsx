import { makeObservable, subscribe } from "./observableUtils.js";

export function tap( sideEffect, source ) {
	return makeObservable( function tapSetup( next ) {
		const subscription = subscribe( function tapCallback( value ) {
			sideEffect( value )
			next( value );
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function map( mapper, source ) {
	return makeObservable( function mapSetup( next ) {
		const subscription = subscribe( function mapCallback( value ) {
			next( mapper( value ) );
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function filter( filterer, source ) {
	return makeObservable( function filterSetup( next ) {
		const subscription = subscribe( function filterCallback( value ) {
			if( filterer( value ) ) {
				next( value );
			}
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function sampleWith( sampler, source ) {
	return makeObservable( function sampleWithSetup( next ) {
		let sourceValue;
		
		const sourceSubscription = subscribe( function sampleCallback( value ) {
			sourceValue = value;
		}, source );
		
		const samplerSubscription = subscribe( function sampleWithCallback() {
			next( sourceValue );
		}, sampler );
		
		return () => {
			sourceSubscription.unsubscribe();
			samplerSubscription.unsubscribe();
		};
	} );
}

export function combine( combiner, source1, source2 ) {
	return combineArray( combiner, [ source1, source2 ] );
}

export function combineArray( combiner, sources ) {
	return makeObservable( function combineArraySetup( next ) {
		const subscriptions = [];
		const values = [];
		
		if( sources.length === 0 ) {
			next( combiner() );
		}
		else {
			for( let i = 0; i < sources.length; i++ ) {
				subscriptions[ i ] = subscribe( function combineArrayCallback( value ) {
					if( values[ i ] === value ) {
						return;
					}
					values[ i ] = value;
					if( values.length === sources.length ) {
						next( combiner( ...values ) );
					}
				}, sources[ i ] );
			}
		}
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function merge( source1, source2 ) {
	return mergeArray( [ source1, source2 ] );
}

export function mergeArray( sources ) {
	return makeObservable( function mergeArraySetup( next ) {
		const subscriptions = sources.map( source => subscribe( next, source ) );
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function switchLatest( source ) {
	return makeObservable( function switchLatestSetup( next ) {
		let currentSubscription;
		
		const sourceSubscription = subscribe( function switchLatestCallback( newSource ) {
			currentSubscription && currentSubscription.unsubscribe();
			currentSubscription = subscribe( next, newSource );
		}, source );
		
		return () => {
			currentSubscription && currentSubscription.unsubscribe();
		};
	} );
}

export { isObservable, makeObservable, makeSignal, subscribe } from "./observableUtils.js";
