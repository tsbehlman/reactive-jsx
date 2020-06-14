import { subscribeForDOM, isObservable } from "./observableUtils.js";

export function mapStreamObject( streamObj, setValueCallback ) {
	for( const [ key, value ] of Object.entries( streamObj ) ) {
		if( isObservable( value ) ) {
			subscribeForDOM( v => setValueCallback( key, v ), value );
		}
		else {
			setValueCallback( key, value );
		}
	}
}

export function mapStreamObjectToTarget( streamObj, target ) {
	mapStreamObject( streamObj, ( key, value ) => target[ key ] = value );
}
