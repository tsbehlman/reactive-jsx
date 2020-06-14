if( Symbol.observable === undefined ) {
	Symbol.observable = Symbol( "observable" );
}

import { Element } from "./render.js";

export function render( component, parent ) {
	const rendered = component.render();
	parent.appendChild( rendered );
}

export function factory( component, props, ...children ) {
	if( props == null ) {
		props = {};
	}
	return new Element( component, props, children );
}

export { withExtensions } from "./withExtensions.js";
export { cleanup } from "./cleanup.js";
export * from "./components.js";
export { Element } from "./render.js";
