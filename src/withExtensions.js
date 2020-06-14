let currentExtensions = [];

export function getExtensions() {
	return currentExtensions;
}

export function withExtensions( ...customExtensions ) {
	return function( component ) {
		return function() {
			const oldExtensions = currentExtensions;
			currentExtensions = customExtensions;
			const returnValue = component.apply( this, arguments );
			currentExtensions = oldExtensions;
			return returnValue;
		}
	};
};
