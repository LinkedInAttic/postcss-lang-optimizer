/* Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 */

var postcss = require('postcss');

var langExtractor = /\[lang=\s*(")?([^\]]+)\1\s*\]|:lang\(([^)]+)\)/;
var regionExtractor = /(.*)-(.*)/;
var annotation = /lang-optimizer:\s+(.*)$/;
var langSelectorRegexp = /\[lang[^\]]+\]|:lang\([^)]+\)/;

function previousComment(rule) {
  if (rule && rule.prev() && rule.prev().type === 'comment') {
    return rule.prev();
  }
}

function extractPreAnnotations(rule) {
  var annotations;
  var curNode = rule.prev();
  while (curNode && curNode.type === 'comment') {
    var md = curNode.text.match(annotation);
    var removeNode = null;
    if (md) {
      if (!annotations) { annotations = [] }
      annotations.unshift(md[1].trim())
      removeNode = curNode;
    }
    if (curNode.prev()) {
      curNode = curNode.prev();
    } else if (curNode.parent.type !== 'root') {
      curNode = curNode.parent.prev();
    } else {
      curNode = undefined;
    }
    if (removeNode) {
      removeNode.remove();
    }
  }
  return annotations;
}

function extractPostAnnotations(rule) {
  var annotations;
  var curNode = rule.next();
  while (curNode && curNode.type === 'comment') {
    var md = curNode.text.match(annotation);
    var removeNode = null;
    if (md) {
      if (!annotations) { annotations = [] }
      annotations.push(md[1].trim())
      removeNode = curNode;
    }
    if (curNode.next()) {
      curNode = curNode.next();
    } else if (curNode.parent.type !== 'root') {
      curNode = curNode.parent.next();
    } else {
      curNode = undefined;
    }
    if (removeNode) {
      removeNode.remove();
    }
  }
  return annotations;
}

module.exports = postcss.plugin('postcss-lang-optimizer', function (opts) {
    opts = opts || {};

    function extractLangFromSelector(selector) {
      var langMatch = selector.match(langExtractor);
      if (langMatch) {
        var lang = langMatch[2] || langMatch[3];
        // language matching is case insensitive
        lang = lang.toLowerCase();
        var regionMatch = lang.match(regionExtractor);
        // Keep any wildcard locales in the base file.
        if (regionMatch && regionMatch[1] == "*") {
          return;
        }
        if (regionMatch && !opts.subtags) {
          // drop the region and keep only the language indicator for purposes of optimization.
          lang = regionMatch[1];
        }
        return lang;
      }
    }

    return function (root, result) {
      var langMap = {};

      function rootForLang(lang) {
        if (!langMap[lang]) {
          langMap[lang] = postcss.root();
        }
        return langMap[lang];
      }

      var optimizationEnabled = true;

      function processAnnotations(annotations) {
        if (annotations) {
          annotations.forEach(function(annotation) {
            if (annotation === "enable") {
              optimizationEnabled = true;
            } else if (annotation == "disable") {
              optimizationEnabled = false;
            }
          });
        }
      }

      function processAtRule(atRule, getContainer) {
        var langsFound = {};

        function containerForLang(lang) {
          if (!langsFound[lang]) {
            var parent = getContainer(lang);
            var container = postcss.atRule({name: atRule.name, params: atRule.params});
            parent.append(container);
            langsFound[lang] = container;
          }
          return langsFound[lang];
        }

        atRule.each(function(node) {
          switch(node.type) {
            case "atrule":
              processAtRule(node, containerForLang)
              break;
            case "rule":
              processRule(node, containerForLang)
              break;
          }
        });
        if (atRule.nodes.length === 0) {
          atRule.remove();
        }
      }

      function processRule(rule, getContainer) {
        if (!langSelectorRegexp.test(rule.selector)) {
          return;
        }
        var removed = [];
        // handle annotations
        processAnnotations(extractPreAnnotations(rule));
        if (!optimizationEnabled) {
          processAnnotations(extractPostAnnotations(rule));
          return;
        }

        var rulesetComment = previousComment(rule);

        var selectors = rule.selectors;
        for (var i = 0; i < selectors.length; i++) {
          var selector = selectors[i];
          var lang = extractLangFromSelector(selector);

          if (lang) {
            var container = getContainer(lang);
            if (container) {
              if (rulesetComment) {
                container.append(rulesetComment.clone());
              }
              container.append(rule.clone({selector: selector}));
              removed.push(i)
            }
          }
        }

        processAnnotations(extractPostAnnotations(rule));

        while (removed.length) {
          selectors.splice(removed.pop(), 1);
        }

        if (selectors.length == 0) {
          rule.parent.removeChild(rule);
          if (rulesetComment) {
            rulesetComment.remove();
          }
        } else {
          rule.selector = selectors.join(", ");
        }
      }

      root.each(function(node) {
        switch (node.type) {
          case "atrule":
            processAtRule(node, rootForLang);
            break;
          case "rule":
            processRule(node, rootForLang);
            break;
        }
        return true;
      });

      var languages = Object.keys(langMap);
      for (var i = 0; i < languages.length; i++) {
        // send extracted language rulesets for this file as postcss messages
        result.messages.push({
          type: "lang-optimization",
          plugin: "postcss-lang-optimizer",
          language: languages[i],
          root: langMap[languages[i]]
        });
      }
    };
});

// helper function to receive extracted language rulesets after processing.
module.exports.extract = function(result, lang) {
  for (var i = 0; i < result.messages.length; i++) {
    if (result.messages[i].type === "lang-optimization" && result.messages[i].language == lang) {
      return result.messages[i].root.toResult({}).css;
    }
  }
}

module.exports.extractAll = function(result) {
  var results = {};
  for (var i = 0; i < result.messages.length; i++) {
    if (result.messages[i].type === "lang-optimization") {
      results[result.messages[i].language] = result.messages[i].root.toResult({}).css;
    }
  }
  return results;
}
