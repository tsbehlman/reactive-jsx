import { makeObservable, subscribe } from "./observableUtils.js";
import { noop } from "./utils.js";

export function tap( sideEffect, source ) {
	return makeObservable( function tapSetup( { next, error, complete } ) {
		const subscription = subscribe( {
			next: function tapNext( value ) {
				sideEffect( value )
				next( value );
			},
			error,
			complete,
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function map( mapper, source ) {
	return makeObservable( function mapSetup( { next, error, complete } ) {
		const subscription = subscribe( {
			next: function mapNext( value ) {
				next( mapper( value ) );
			},
			error,
			complete,
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function filter( filterer, source ) {
	return makeObservable( function filterSetup( { next, error, complete } ) {
		const subscription = subscribe( {
			next: function filterNext( value ) {
				if( filterer( value ) ) {
					next( value );
				}
			},
			error,
			complete,
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function sampleWith( sampler, source ) {
	return makeObservable( function sampleWithSetup( { next, error, complete } ) {
		let sourceValue;
		
		const sourceSubscription = subscribe( {
			next: function sampleNext( value ) {
				sourceValue = value;
			},
			error,
			complete,
		}, source );
		
		const samplerSubscription = subscribe( {
			next: function sampleWithNext() {
				next( sourceValue );
			},
			error,
			complete,
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
	return makeObservable( function combineArraySetup( { next, error, complete } ) {
		const subscriptions = [];
		const values = [];
		
		if( sources.length === 0 ) {
			next( combiner() );
		}
		else {
			for( let i = 0; i < sources.length; i++ ) {
				subscriptions[ i ] = subscribe( {
					next: function combineArrayNext( value ) {
						if( values[ i ] === value ) {
							return;
						}
						values[ i ] = value;
						if( values.length === sources.length ) {
							next( combiner( ...values ) );
						}
					},
					error,
					complete,
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
	return makeObservable( function mergeArraySetup( observer ) {
		const subscriptions = sources.map( source => subscribe( observer, source ) );
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function switchLatest( source ) {
	return makeObservable( function switchLatestSetup( { next, error, complete } ) {
		let currentSubscription = null;
		
		const sourceSubscription = subscribe( {
			next: function switchLatestNext( newSource ) {
				currentSubscription && currentSubscription.unsubscribe();
				currentSubscription = subscribe( {
					next,
					error,
					complete: noop,
				}, newSource );
			},
			error,
			complete,
		}, source );
		
		return () => currentSubscription && currentSubscription.unsubscribe();
	} );
}

export function mapError( errorHandler, source ) {
	return makeObservable( function catchErrorSetup( { next, complete } ) {
		const subscription = subscribe( {
			next,
			error: function catchErrorHandler( error ) {
				next( errorHandler( error ) );
			},
			complete,
		}, source );
		
		return () => subscription.unsubscribe();
	} );
}

export function fromPromise( promise, defaultValue ) {
	return makeObservable( function fromPromiseSetup( { next, error, complete } ) {
		promise.then( next, error ).finally( complete );
		next( defaultValue );
	} );
}

export { isObservable, makeObservable, makeSignal, subscribe } from "./observableUtils.js";
