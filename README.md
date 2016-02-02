# Ember-cli-css-lang-optimizer

This addon causes language specific rulesets in CSS to be extracted into
per-language css files. The original CSS file has the language specific
rulesets removed from it.

## Configuration

In environment.js you can customize the behavior of this addon by
passing options to your APP under the `langOptimizer` key:

```js
// environment.js
{
  APP: {
     langOptimizer: {
       // includeBaseFile controls whether the base css is included
       // in every language-specific output file. When set to `false`,
       // only the lang-specific selectors are output to the language
       // specific file. Defaults to `true`.
       includeBaseFile: true,
       // filenameForLang is optional, when omited the filename is "<basename>_<lang>.css"
       filenameForLang: function(baseFilename, lang) {
         return baseFilename.replace(".css", "-" + lang + ".css")
       },
       // Passed along to the underlying postcss-lang-optimizer plugin.  Defaults to false.
       subtags: false,
       // Ensures a file is written for each of these languages (and only these languages)
       // even if they are or are not specified in the source CSS.
       // If omitted, languages are discovered from the source CSS file.
       langs: ["en", "de", "zh"]
     }
  }
}
```
