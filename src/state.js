import { makeObservable } from "./observableUtils.js";
import { noop, passthrough } from "./utils.js";

export function useSignal( initialValue, mapper = passthrough ) {
	let dispatch = noop;
	let value = initialValue;
	
	const signal = makeObservable( dispatchFunction => {
		dispatch = dispatchFunction;
		dispatch( value );
	} );

	signal.get = function getValue() {
		return value;
	};

	signal.set = function setValue( newValue ) {
		if( typeof newValue === "function" ) {
			newValue = newValue( value );
		}
		
		value = mapper( newValue );
		
		dispatch( value );
	};
	
	signal.toJSON = signal.get;

	return signal;
}
