let currentExtensions = [];

export function getExtensions() {
	return currentExtensions;
}

export function withExtensions( ...customExtensions ) {
	return function( component ) {
		return function( ...args ) {
			const oldExtensions = currentExtensions;
			currentExtensions = customExtensions;
			const returnValue = component( ...args );
			currentExtensions = oldExtensions;
			return returnValue;
		}
	};
};
