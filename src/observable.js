import { isObservable, Observable, Signal, Just, wrapObservable } from "./observableUtils.js";
import { noop, passthrough } from "./utils.js";

export function tap( sideEffect, source ) {
	return new Observable( function tapSetup( { next, error, complete } ) {
		return wrapObservable( source ).subscribe( {
			next: function tapNext( value ) {
				sideEffect( value )
				next( value );
			},
			error,
			complete,
		} );
	} );
}

export function map( mapper, source ) {
	return new Observable( function mapSetup( { next, error, complete } ) {
		return wrapObservable( source ).subscribe( {
			next: function mapNext( value ) {
				next( mapper( value ) );
			},
			error,
			complete,
		} );
	} );
}

export function filter( filterer, source ) {
	return new Observable( function filterSetup( { next, error, complete } ) {
		return wrapObservable( source ).subscribe( {
			next: function filterNext( value ) {
				if( filterer( value ) ) {
					next( value );
				}
			},
			error,
			complete,
		} );
	} );
}

export function sampleWith( sampler, source ) {
	return new Observable( function sampleWithSetup( { next, error, complete } ) {
		let sourceValue;
		
		const sourceSubscription = wrapObservable( source ).subscribe( {
			next: function sampleNext( value ) {
				sourceValue = value;
			},
			error,
			complete,
		} );
		
		const samplerSubscription = wrapObservable( sampler ).subscribe( {
			next: function sampleWithNext() {
				next( sourceValue );
			},
			error,
			complete,
		} );
		
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
	return new Observable( function combineArraySetup( { next, error, complete } ) {
		const subscriptions = [];
		const values = new Array( sources.length );
		
		let isInitialized = false;
		let nextPromise;
		
		function combineAndCallNext() {
			next( combiner( ...values ) );
			nextPromise = undefined;
		}
		
		if( sources.length === 0 ) {
			next( combiner() );
		}
		else {
			sources.forEach( ( source, index ) => {
				subscriptions[ index ] = wrapObservable( source ).subscribe( {
					next: function combineArrayNext( value ) {
						if( isInitialized && values[ index ] === value ) {
							return;
						}
						values[ index ] = value;
						if( !isInitialized && Object.values( values ).length === sources.length ) {
							isInitialized = true;
							combineAndCallNext();
						}
						else if( isInitialized && nextPromise === undefined ) {
							nextPromise = Promise.resolve().then( combineAndCallNext );
						}
					},
					error,
					complete: function combineArrayComplete() {
						if( subscriptions.every( subscription => subscription.closed ) ) {
							complete();
						}
					},
				} );
			} );
		}
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function merge( source1, source2 ) {
	return mergeArray( [ source1, source2 ] );
}

export function mergeArray( sources ) {
	return new Observable( function mergeArraySetup( { next, error, complete } ) {
		const subscriptions = sources.map( ( source, index ) => wrapObservable( source ).subscribe( {
			next,
			error,
			complete: function mergeArrayComplete() {
				if( subscriptions.every( subscription => subscription.closed ) ) {
					complete();
				}
			},
		} ) );
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function switchLatest( source ) {
	return new Observable( function switchLatestSetup( { next, error, complete } ) {
		let currentSubscription = null;
		
		const sourceSubscription = wrapObservable( source ).subscribe( {
			next: function switchLatestNext( newSource ) {
				currentSubscription && currentSubscription.unsubscribe();
				currentSubscription = newSource.subscribe( {
					next,
					error,
					complete: noop,
				} );
			},
			error,
			complete,
		} );
		
		return () => currentSubscription && currentSubscription.unsubscribe();
	} );
}

export function mapError( errorHandler, source ) {
	return new Observable( function catchErrorSetup( { next, complete } ) {
		return wrapObservable( source ).subscribe( {
			next,
			error: function catchErrorHandler( error ) {
				next( errorHandler( error ) );
			},
			complete,
		} );
	} );
}

export function fromPromise( promise, defaultValue ) {
	return new Observable( function fromPromiseSetup( { next, error, complete } ) {
		promise.then( next, error ).finally( complete );
		next( defaultValue );
	} );
}

export function switchLatestPromise( source, defaultValue ) {
	return new Observable( function switchLatestSetup( { next, error, complete } ) {
		next( defaultValue );
		return wrapObservable( source ).subscribe( {
			next: function switchLatestNext( promise ) {
				promise.then( next, error );
			},
			error,
			complete,
		} );
	} );
}

export * from "./observableUtils.js";
