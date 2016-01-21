# PostCSS Lang Optimizer

Extract rulesets that are language specific into their own file so they
can be served at runtime in a more optimal way.

The AST is walked only once and language specific rulesets are collected
along the way. After processing, the language specific selectors can be
written out to their own files or re-combined in various ways according
to how you desire to send the locale specific CSS over the wire.

If a single selector has more than one lang or is combined with
non-lang-specific selectors, then the ruleset is duplicated and the
language specific selectors are removed.

### API

```js
langOptimizer = require("postcss-lang-optimizer");
postcss = require("postcss");

var optimizerOptions = {};
var input = ".foo { font-size: 14px; } .foo:lang(zh) { font-size: 18px; }"
var result = postcss(langOptimizer(optimizerOptions)).process(input);
// language agnostic CSS stripped of all language specific rulesets
result.css; // => ".foo { font-size: 14px; }"
// zh-specific CSS
langOptimizer.extract(result, "zh"); // => " .foo:lang(zh) { font-size: 18px; }"
```

### Options:

* `subtags` - When set to true, then any language selectors will be
extracted to their own file. That is `de`, `de-DE` and `de-DE-1996`
would each be extracted to their own file.

### The following `:lang` features are not well supported:

* Wildcard language matching E.g. `:lang(*-CH)` - These will be left in
  the base file.

### Known Issues:

* Sourcemaps will not work with language specific output files.
* There's not currently any way to except a lang selector from being
  extracted.
