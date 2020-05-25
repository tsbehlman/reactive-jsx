import { mapStreamObjectToTarget } from "./extensionUtils";

export function style( { style, ...props }, element ) {
	if( style !== undefined ) {
		if( style.constructor === String ) {
			element.style.cssText = style;
		}
		else {
			mapStreamObjectToTarget( style, element.style );
		}
	}
	
	return props;
}

export function dataset( { dataset, ...props }, element ) {
	if( dataset !== undefined ) {
		mapStreamObjectToTarget( dataset, element.dataset );
	}

	return props;
}

export function events( { events, ...props }, element ) {
	if( events !== undefined ) {
		for( const [ eventName, listener ] of Object.entries( events ) ) {
			listener && element.addEventListener( eventName, listener, false );
		}
	}

	return props;
}

export function classes( { classes, ...props }, element ) {
	if( classes !== undefined ) {
		mapClassesToClassList( classes, element.classList );
	}

	return props;
}
