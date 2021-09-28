import { makeObservable } from "./observableUtils.js";
import { passthrough } from "./utils.js";

export function useSignal( initialValue, mapper = passthrough ) {
	const [ signal, dispatch, get ] = makeObservable();

	signal.get = get;

	signal.set = function setValue( value ) {
		if( typeof value === "function" ) {
			value = value( get() );
		}
		
		dispatch( mapper( value ) );
	};
	
	signal.toJSON = get;
	
	dispatch( initialValue );

	return signal;
}
