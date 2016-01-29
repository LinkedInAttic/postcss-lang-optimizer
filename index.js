/* jshint node: true */
'use strict';

var postCSSFilter = require("broccoli-postcss-sourcemaps");
var 

module.exports = {
  name: 'ember-cli-css-lang-optimizer',

  setupPreprocessorRegistry: function(type, registry) {
    var addon = this;
    registry.add('css', {
      name: 'lang-optimizer',
      ext: 'css',
      toTree: function(tree, inputPath, outputPath, options) {

        // These start with a slash and that messes things up.
        var cssDir = outputPath.slice(1);
        var sassDir = inputPath.slice(1);

        // limit to only files in the sass directory.
        tree = stew.find(tree, {include: [sassDir + "/**/*"]});

        var projectConfig = addon.project.config(addon.app.env);
        // setup eyeglass for this project's configuration
        var config = projectConfig.eyeglass || {};
        config.cssDir = cssDir;
        config.sassDir = sassDir;
        config.assets = ["public", "app"].concat(config.assets || []);
        config.httpRoot = projectConfig.baseURL;
        config.assetsHttpPrefix = config.assetsHttpPrefix || "assets";

        // rename app.css to <project>.css per ember conventions.
        var originalGenerator = config.optionsGenerator;
        config.optionsGenerator = function(sassFile, cssFile, sassOptions, compilationCallback) {
          cssFile = cssFile.replace(/app\.css$/, addon.app.name + ".css");
          if (originalGenerator) {
            originalGenerator(sassFile, cssFile, sassOptions, compilationCallback);
          } else {
            compilationCallback(cssFile, sassOptions);
          }
        };
        return new EyeglassCompiler(tree, config);
      }
    });
  }

};
