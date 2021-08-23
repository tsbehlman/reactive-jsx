import { createComponent } from "./render.js";
import { mountElement } from "./mount.js";

export function template( html, wrappedContent ) {
	const templateElement = document.createElement( "template" );
	templateElement.innerHTML = html;
	const node = templateElement.content.firstChild;
	return wrappedContent ? node.firstChild : node;
};

export function fragment( html ) {
	const templateElement = document.createElement( "template" );
	templateElement.innerHTML = html;
	return templateElement.content;
}

export function render( component, props, parent ) {
	const element = createComponent( component, props );
	mountElement( parent, element, undefined, true );
}

export { withExtensions } from "./withExtensions.js";
export { onMount, onUnmount } from "./mount.js";
export * from "./components.js";
export * from "./render.js";
export { applyRef } from "./ref.js";
