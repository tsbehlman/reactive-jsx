module.exports = function makeBabelPlugin( {
    builtins = [],
    customAttributes = {},
    ...rest
} = {} ) {
    return [ "babel-plugin-jsx-dom-expressions", {
        moduleName: "reactive",
        builtIns: [
            "Text",
            ...builtins,
        ],
        customAttributes: {
            events: "applyEvents",
            style: "applyStyle",
            classList: "applyClassList",
            dataset: "applyDataset",
            ref: "applyRef",
            ...customAttributes,
        },
        ...rest,
    } ]
}