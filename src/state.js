import { makeObservable } from "./observableUtils.js";
import { passthrough } from "./utils.js";

export function useSignal( initialValue ) {
	const [ signal, dispatch, get ] = makeObservable();

	let extension = passthrough;

	signal.get = get;

	signal.set = function setValue( value ) {
		if( typeof value === "function" ) {
			value = value( get() );
		}
		
		dispatch( extension( value ) );
	};
	
	signal.extend = function( newExtension ) {
		const oldExtension = extension;
		extension = function( value ) {
			return newExtension( oldExtension( value ) );
		};
		return signal;
	}
	
	signal.toJSON = get;
	
	dispatch( initialValue );

	return signal;
}
