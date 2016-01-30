/* jshint node: true */
'use strict';

var postCSSFilter = require("broccoli-postcss-sourcemaps");
var langOptimizer = require("postcss-lang-optimizer");

module.exports = {
  name: 'ember-cli-css-lang-optimizer',

  setupPreprocessorRegistry: function(type, registry) {
    var addon = this;
    registry.add('css', {
      name: 'lang-optimizer',
      ext: 'css',
      toTree: function(tree, inputPath, outputPath, options) {
        var config = addon.project.config(addon.app.env).APP.langOptimizer || {};

        return postCSSFilter(tree, {
          plugins: [
            {
              module: langOptimizer,
              options: {subtags: config.subtags}
            }
          ],
          resultHandler: function(result, filter, relativePath, addOutputFile) {
            var langResults = langOptimizer.extractAll(result);
            var langs = config.langs ? config.langs : Object.keys(langResults)
            langs.forEach(function (lang) {
              var langFilename, langCSS;
              if (config.filenameForLang) {
                langFilename = config.filenameForLang(relativePath, lang);
              } else {
                langFilename = relativePath.replace(".css", "_" + lang + ".css")
              }
              if (config.includeBaseFile || typeof config.includeBaseFile == 'undefined') {
                langCSS = result.css + "\n" + (langResults[lang] || "") + "\n";
              } else {
                langCSS = (langResults[lang] || "") + "\n";
              }
              addOutputFile(langCSS, langFilename);
            });
          }
        });
      }
    });
  }

};
