# reactive-jsx

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
