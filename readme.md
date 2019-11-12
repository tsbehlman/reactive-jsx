# reactive-jsx

While working on this I discovered that [ryansolid](https://github.com/ryansolid) has already realized the vision I had for this in the form of [dom-expressions](https://github.com/ryansolid/dom-expressions) and [solid](https://github.com/ryansolid/solid).  This remains a fun experiment.

* * *

A prototype reactive DOM framework with support for JSX.  Inspired by [surplus](https://github.com/adamhaile/surplus).

Reactive library support is currently limited to [most 1.0](https://github.com/cujojs/most).

To use JSX with this framework, you can configure babel with [@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/next/babel-plugin-transform-react-jsx.html) like so:

```js
{
	"plugins": [
		[ "@babel/plugin-transform-react-jsx", {
			"pragma": "Reactive.factory",
			"pragmaFrag": "Reactive.Fragment"
		} ]
	]
}
```
