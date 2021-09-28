import { noop, passthrough } from "./utils.js";

if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}

export function makeObservable( setup ) {
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

	return {
		[Symbol.observable]() {
			return this;
		},
		subscribe( observer ) {
			if( observers.size === 0 && setup ) {
				cleanup = setup( observerProxy );
			}
			observers.add( observer );
			observer.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					observers.delete( observer );
					if( observers.size === 0 && cleanup ) {
						cleanup();
					}
				}
			};
		}
	};
}

export function makeSignal( initialValue, mapper = passthrough ) {
	const observers = new Set();
	let value = initialValue;

	return {
		[Symbol.observable]() {
			return this;
		},
		subscribe( observer ) {
			observers.add( observer );
			observer.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					observers.delete( observer );
				}
			};
		},
		get() {
			return value;
		},
		set( newValue ) {
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
		},
		toJSON() {
			return value;
		}
	};
}

export function subscribe( observer, observable ) {
	let subscription;
	const {
		next = noop,
		error = function defaultError( error ) {
			console.error( "Uncaught observable error", error );
		},
		complete = function defaultComplete() {
			subscription.unsubscribe();
		},
	} = observer;
	
	subscription = observable[Symbol.observable]().subscribe( { next, error, complete } );
	
	return subscription;
}
