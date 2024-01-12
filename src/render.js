import { isObservable } from "./observableUtils.js";
import { makeMountContext, wrapMountContext, wrapCurrentMountContext, doMount, doUnmount, subscribeForDOM } from "./mount.js";
import { applyRef } from "./ref.js";

function assignObjectToElement(object, setValueCallback) {
    for (const [key, valueOrObservable] of Object.entries(object)) {
        if (isObservable(valueOrObservable)) {
            subscribeForDOM(value => setValueCallback(key, value), valueOrObservable);
        } else {
            setValueCallback(key, valueOrObservable);
        }
    }
}

function assignObjectToObject(object, target) {
    assignObjectToElement(object, (key, value) => {
        target[key] = value;
    });
}

class ReactiveNode {
    constructor() {
        this.node = null;
        this.startNode = null;
        this.endNode = null;
    }

    render() {}

    mount(parentNode, markerNode) {
        if (isComponentNode(this.node)) {
            this.node.render();
            this.node.mount(parentNode, markerNode);
        } else {
            if (this.node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                this.startNode = this.node.firstChild;
                this.endNode = this.node.lastChild;
            }
            if (markerNode) {
                parentNode.insertBefore(this.node, markerNode);
            } else {
                parentNode.appendChild(this.node);
            }
        }
    }

    unmount() {
        if (this.node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            let currentNode = this.startNode;
            while (currentNode !== this.endNode) {
                const nextNode = currentNode.nextSibling;
                currentNode.parentNode.removeChild(currentNode);
                currentNode = nextNode;
            }
            this.endNode.parentNode.removeChild(this.endNode);
        } else {
            this.node.parentNode.removeChild(this.node);
        }
    }
}

class ComponentNode extends ReactiveNode {
    constructor(factory, props, children) {
        super();
        this.factory = factory;
        this.props = props;
        this.children = children;
        this.mountContext = null;
    }

    render() {
        if (this.mountContext === null) {
            this.mountContext = makeMountContext();
            this.node = wrapMountContext(this.mountContext, () => this.factory(this.props, this.children))();
        }
    }

    mount(parentNode, markerNode) {
        if (this.node) {
            super.mount(parentNode, markerNode);
            doMount(this.mountContext);
        }
    }

    unmount() {
        if (this.node) {
            super.unmount();
            doUnmount(this.mountContext);
        }
    }
}

class FragmentNode extends ReactiveNode {
    render() {
        super.render();
        this.node = document.createDocumentFragment();
    }
}

class ObservableNode extends FragmentNode {
    constructor(observable) {
        super();
        this.observable = observable;
        this.children = new Set();
        this.subscription = null;
    }

    render() {
        super.render();
        this.node.appendChild(document.createComment(""));
        this.node.appendChild(document.createComment(""));
    }

    makeChildObserver() {
        return wrapCurrentMountContext(values => {
            if (!Array.isArray(values)) {
                values = [values];
            }

            let previousNode = this.startNode;
            const parentNode = previousNode.parentNode;

            const newChildren = new Set();

            for (const value of values) {
                const newReactiveNode = makeReactiveNode(value);
                if (newReactiveNode !== undefined) {
                    newReactiveNode.render();
                    if ((newReactiveNode.startNode || newReactiveNode.node).previousSibling !== previousNode) {
                        newReactiveNode.mount(parentNode, previousNode.nextSibling);
                    }
                    previousNode = newReactiveNode.endNode || newReactiveNode.node || previousNode;
                    newChildren.add(newReactiveNode);
                    this.children.delete(newReactiveNode);
                }
            }

            // remove remaining old nodes
            for (const oldReactiveNode of this.children) {
                oldReactiveNode.unmount();
            }

            this.children = newChildren;
        });
    }

    mount(parentNode, markerNode) {
        super.mount(parentNode, markerNode);
        if (this.subscription === null) {
            this.subscription = this.observable[Symbol.observable]().subscribe({
                next: this.makeChildObserver(),
                error: function observableNodeError(error) {
                    console.error("Uncaught observable error", error);
                },
                complete: () => {
                    this.subscription.unsubscribe();
                },
            });
        }
    }

    unmount() {
        this.subscription.unsubscribe();
        super.unmount();
    }
}

class ArrayNode extends FragmentNode {
    constructor(array) {
        super();
        this.array = array;
    }

    render() {
        super.render();
        for (const item of this.array) {
            const reactiveNode = makeReactiveNode(item);
            if (reactiveNode !== undefined) {
                reactiveNode.render();
                reactiveNode.mount(this.node);
            }
        }
    }
}

class DomNode extends ReactiveNode {
    constructor(node) {
        super();
        this.node = node;
    }
}

function isComponentNode(object) {
    return object && object.constructor === ComponentNode;
}

export function createComponent(component, props, children) {
    return new ComponentNode(component, props, children);
}

export function insert(parentNode, child, markerNode) {
    const reactiveNode = makeReactiveNode(child);
    if (reactiveNode === undefined) {
        return;
    }
    reactiveNode.render();
    reactiveNode.mount(parentNode, markerNode);
}

export function assignToElement(value, setter) {
    if (isObservable(value)) {
        subscribeForDOM(setter, value);
    } else {
        setter(value);
    }
}

export function spread(element, props, isSVG) {
    const { style, dataset, events, classList, ref, ...attributes } = props;

    if (isSVG) {
        assignObjectToElement(attributes, (key, value) => element.setAttribute(key, value));
    } else {
        assignObjectToObject(attributes, element);
    }

    style && applyStyle(element, style);

    dataset && applyDataset(element, dataset);

    events && applyEvents(element, events);

    classList && applyClassList(element, classList);

    ref && applyRef(element, ref);
}

export function applyClassList(element, classList) {
    assignObjectToElement(classList, function toggleClassName(className, shouldAdd) {
        if (shouldAdd) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    });
}

export function applyStyle(element, style) {
    if (style.constructor === String) {
        element.style.cssText = style;
    } else {
        assignObjectToObject(style, element.style);
    }
}

export function applyDataset(element, dataset) {
    assignObjectToObject(dataset, element.dataset);
}

export function applyEvents(element, events) {
    for (const [eventName, listener] of Object.entries(events)) {
        listener && element.addEventListener(eventName, listener, false);
    }
}

function makeReactiveNode(value) {
    if (value === undefined || value === false || value === null) {
        return undefined;
    }

    if (value instanceof Node) {
        return new DomNode(value);
    } else if (isComponentNode(value)) {
        return value;
    } else if (isObservable(value)) {
        return new ObservableNode(value);
    } else if (Array.isArray(value)) {
        return new ArrayNode(value);
    } else {
        return new DomNode(document.createTextNode(value));
    }
}
