import "./observableUtils.js";
import { noop, passthrough } from "./utils.js";

export class Observable {
	constructor( setup ) {
		const observers = new Set();
		let value;
		let cleanup;
		
		const observerProxy = {
			next( newValue ) {
				if( value === newValue ) {
					return;
				}
				value = newValue;
				for( const observer of observers ) {
					observer.next( newValue );
				}
			},
			error( error ) {
				for( const observer of observers ) {
					observer.error( error );
				}
			},
			complete() {
				for( const observer of observers ) {
					observer.complete();
				}
			}
		};
		
		this.subscribe = function subscribe( observer ) {
			const subscription = {
				closed: false,
				unsubscribe() {
					this.closed = true;
					observers.delete( observer );
					if( observers.size === 0 && cleanup ) {
						cleanup();
					}
				}
			};
			
			observer.error = observer.error || function defaultError( error ) {
				console.error( "Uncaught observable error", error );
			};
			observer.complete = observer.complete || function defaultComplete( error ) {
				subscription.unsubscribe();
			};
			
			if( observers.size === 0 && setup ) {
				cleanup = setup( observerProxy );
			}
			observers.add( observer );
			observer.next( value );
			return subscription;
		};
	}
	
	[Symbol.observable]() {
		return this;
	}
}

export class Signal {
	constructor( initialValue, mapper = passthrough ) {
		const observers = new Set();
		let value = initialValue;
		
		this.subscribe = function subscribe( observer ) {
			if( typeof observer === "function" ) {
				observer = { next: observer };
			}
			observers.add( observer );
			observer.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					observers.delete( observer );
				}
			};
		};
		
		this.get = function get() {
			return value;
		};
		
		this.set = function set( newValue ) {
			if( typeof newValue === "function" ) {
				newValue = newValue( value );
			}
		
			newValue = mapper( newValue );
		
			if( value === newValue ) {
				return;
			}
			value = newValue;
			for( const observer of observers ) {
				observer.next( newValue );
			}
		};
		
		this.toJSON = function toJSON() {
			return value;
		};
	}
	
	[Symbol.observable]() {
		return this;
	}
}

export function tap( sideEffect, source ) {
	return new Observable( function tapSetup( { next, error, complete } ) {
		const subscription = source.subscribe( {
			next: function tapNext( value ) {
				sideEffect( value )
				next( value );
			},
			error,
			complete,
		} );
		
		return () => subscription.unsubscribe();
	} );
}

export function map( mapper, source ) {
	return new Observable( function mapSetup( { next, error, complete } ) {
		const subscription = source.subscribe( {
			next: function mapNext( value ) {
				next( mapper( value ) );
			},
			error,
			complete,
		} );
		
		return () => subscription.unsubscribe();
	} );
}

export function filter( filterer, source ) {
	return new Observable( function filterSetup( { next, error, complete } ) {
		const subscription = source.subscribe( {
			next: function filterNext( value ) {
				if( filterer( value ) ) {
					next( value );
				}
			},
			error,
			complete,
		} );
		
		return () => subscription.unsubscribe();
	} );
}

export function sampleWith( sampler, source ) {
	return new Observable( function sampleWithSetup( { next, error, complete } ) {
		let sourceValue;
		
		const sourceSubscription = source.subscribe( {
			next: function sampleNext( value ) {
				sourceValue = value;
			},
			error,
			complete,
		} );
		
		const samplerSubscription = sampler.subscribe( {
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
		const values = [];
		
		if( sources.length === 0 ) {
			next( combiner() );
		}
		else {
			for( let i = 0; i < sources.length; i++ ) {
				subscriptions[ i ] = sources[ i ].subscribe( {
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
				} );
			}
		}
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function merge( source1, source2 ) {
	return mergeArray( [ source1, source2 ] );
}

export function mergeArray( sources ) {
	return new Observable( function mergeArraySetup( observer ) {
		const subscriptions = sources.map( source => source.subscribe( observer ) );
		
		return () => subscriptions.forEach( subscription => subscription.unsubscribe() );
	} );
}

export function switchLatest( source ) {
	return new Observable( function switchLatestSetup( { next, error, complete } ) {
		let currentSubscription = null;
		
		const sourceSubscription = source.subscribe( {
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
		const subscription = source.subscribe( {
			next,
			error: function catchErrorHandler( error ) {
				next( errorHandler( error ) );
			},
			complete,
		} );
		
		return () => subscription.unsubscribe();
	} );
}

export function fromPromise( promise, defaultValue ) {
	return new Observable( function fromPromiseSetup( { next, error, complete } ) {
		promise.then( next, error ).finally( complete );
		next( defaultValue );
	} );
}

export { isObservable } from "./observableUtils.js";
