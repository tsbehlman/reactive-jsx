import { passthrough } from "./utils.js";

if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol( "observable" );
}

export function isObservable( object ) {
	return object && object[ Symbol.observable ];
}

export function makeObservable( setup ) {
	const subscribers = new Set();
	let value;
	let cleanup;
	
	function dispatch( newValue ) {
		if( value === newValue ) {
			return;
		}
		value = newValue;
		for( const subscriber of subscribers ) {
			subscriber.next( newValue );
		}
	}

	return {
		[Symbol.observable]() {
			return this;
		},
		subscribe( subscriber ) {
			if( subscribers.size === 0 && setup ) {
				cleanup = setup( dispatch );
			}
			subscribers.add( subscriber );
			subscriber.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					subscribers.delete( subscriber );
					if( subscribers.size === 0 && cleanup ) {
						cleanup();
					}
				}
			};
		}
	};
}

export function makeSignal( initialValue, mapper = passthrough ) {
	const subscribers = new Set();
	let value = initialValue;

	return {
		[Symbol.observable]() {
			return this;
		},
		subscribe( subscriber ) {
			subscribers.add( subscriber );
			subscriber.next( value );
			return {
				closed: false,
				unsubscribe() {
					this.closed = true;
					subscribers.delete( subscriber );
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
			for( const subscriber of subscribers ) {
				subscriber.next( newValue );
			}
		},
		toJSON() {
			return value;
		}
	};
}

export function subscribe( next, observable ) {
	return observable[Symbol.observable]().subscribe( { next } );
}
