var postcss = require('postcss');

var langExtractor = /\[lang=\s*(")?([^\]]+)\1\s*\]|:lang\(([^)]+)\)/

module.exports = postcss.plugin('postcss-lang-optimizer', function (opts) {
    opts = opts || {};

    // Work with options here

    return function (css, result) {

      result.foo = "bar";
      var langMap = {};

      css.walkRules(/\[lang[^\]]+\]|:lang\([^)]+\)/, function(rule) {
        var removed = [];
        var selectors = rule.selectors;
        for (var i = 0; i < selectors.length; i++) {
          var selector = selectors[i];
          var langMatch = selector.match(langExtractor);
          if (langMatch) {
            var lang = langMatch[2] || langMatch[3];
            if (!langMap[lang]) {
              langMap[lang] = postcss.root();
            }
            var selector_was = rule.selector;
            rule.selector = selector;
            var ruleset = rule.toString();
            rule.selector = selector_was;
            langMap[lang].append(ruleset);
            removed.push(i)
          }
        }
        while (removed.length) {
          selectors.splice(removed.pop(), 1);
        }


        if (selectors.length == 0) {
          rule.parent.removeChild(rule);
        } else {
          rule.selector = selectors.join(", ");
        }
        var languages = Object.keys(langMap);
        for (var i = 0; i < languages.length; i++) {
          result.messages.push({
            type: "lang-optimization",
            plugin: "postcss-lang-optimizer",
            language: languages[i],
            root: langMap[languages[i]]
          });
        }
      });
    };
});

