import { makeObservable } from "./observableUtils.js";

function passthrough( value ) {
	return value;
}

export function useSignal( initialValue ) {
	const [ signal, dispatch, get ] = makeObservable();

	let extension = passthrough;

	signal.get = get;

	signal.set = function setValue( newValue ) {
		if( typeof newValue === "function" ) {
			newValue = newValue( get() );
		}
		
		dispatch( extension( newValue ) );
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
