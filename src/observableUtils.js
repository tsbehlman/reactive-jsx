import { noop, passthrough } from "./utils.js";

if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol.for( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}

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

			if( typeof observer === "function" ) {
				observer = { next: observer };
			}
			observer.error = observer.error || function defaultError( error ) {
				console.error( "Uncaught observable error", error );
			};
			observer.complete = observer.complete || function defaultComplete() {
				subscription.unsubscribe();
			};

			if( observers.size === 0 && setup ) {
				const setupReturnValue = setup( observerProxy );
				if( !!setupReturnValue && typeof setupReturnValue !== "function" ) {
					cleanup = () => setupReturnValue.unsubscribe();
				}
				else {
					cleanup = setupReturnValue;
				}
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

export class Just {
	constructor( value ) {
		this.value = value;
	}

	[Symbol.observable]() {
		return this;
	}

	subscribe( observer ) {
		if( typeof observer === "function" ) {
			observer = { next: observer };
		}
		else {
			observer.next( this.value );
			observer.complete();
		}
		return {
			closed: true,
			unsubscribe: noop
		};
	}

	toJSON() {
		return value;
	}
}

export function wrapObservable( value ) {
	if( isObservable( value ) ) {
		return value;
	}
	else {
		return new Just( value );
	}
}
