import { passthrough } from "./utils.js";

export function useSignal( initialValue, mapper = passthrough ) {
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
			
			value = mapper( newValue );
			
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
