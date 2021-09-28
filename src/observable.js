import { makeObservable, subscribe } from "./observableUtils.js";

export function tap( sideEffect, source ) {
	return makeObservable( function tapSetup( dispatch ) {
		const subscription = subscribe( function tapCallback( value ) {
			sideEffect( value )
			dispatch( value );
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function map( mapper, source ) {
	return makeObservable( function mapSetup( dispatch ) {
		const subscription = subscribe( function mapCallback( value ) {
			dispatch( mapper( value ) );
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function filter( filterer, source ) {
	return makeObservable( function filterSetup( dispatch ) {
		const subscription = subscribe( function filterCallback( value ) {
			if( filterer( value ) ) {
				dispatch( value );
			}
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function sampleWith( sampler, source ) {
	return makeObservable( function sampleWithSetup( dispatch ) {
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
}

export function combine( combiner, source1, source2 ) {
	return combineArray( combiner, [ source1, source2 ] );
}

export function combineArray( combiner, sources ) {
	return makeObservable( function combineArraySetup( dispatch ) {
		const subscriptions = [];
		const values = [];
		
		if( sources.length === 0 ) {
			dispatch( combiner() );
		}
		else {
			for( let i = 0; i < sources.length; i++ ) {
				subscriptions[ i ] = subscribe( function combineArrayCallback( value ) {
					if( values[ i ] === value ) {
						return;
					}
					values[ i ] = value;
					if( values.length === sources.length ) {
						dispatch( combiner( ...values ) );
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
	return makeObservable( function mergeArraySetup( dispatch ) {
		const subscriptions = sources.map( source => subscribe( dispatch, source ) );
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function switchLatest( source ) {
	return makeObservable( function switchLatestSetup( dispatch ) {
		let currentSubscription;
		
		const sourceSubscription = subscribe( function switchLatestCallback( newSource ) {
			currentSubscription && currentSubscription.unsubscribe();
			currentSubscription = subscribe( dispatch, newSource );
		}, source );
		
		return () => {
			currentSubscription && currentSubscription.unsubscribe();
		};
	} );
}

export { isObservable, makeObservable, makeSignal, subscribe } from "./observableUtils.js";
