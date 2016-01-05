# PostCSS Lang Optimizer

Extract rulesets that are language specific into their own file so they
can be served at runtime in a more optimal way.

The AST is walked only once and language specific rulesets are collected
along the way. After processing, the language specific selectors can be
written out to their own files or re-combined in various ways according
to how you desire to send the locale specific CSS over the wire.

### API

```js
langOptimizer = require("postcss-lang-optimizer");
postcss = require("postcss");

var optimizerOptions = {};
var input = ".foo {font-size: 14px; } .foo:lang(zh) { font-size: 18px; }"
var result = postcss(langOptimizer(optimizerOptions)).process(input);
result.css; // language agnostic CSS stripped of all language specific rulesets
langOptimizer.extract(result, "zh"); // zh-specific CSS
```

### Options:

* `subtags` - When set to true, then any language selectors will be
extracted to their own file. That is `de`, `de-DE` and `de-DE-1996`
would each be extracted to their own file.

### The following `:lang` features are not well supported:

* Wildcard language matching E.g. `:lang(*-CH)` - These will be left in
  the base file.
