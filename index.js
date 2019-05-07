/* jshint node: true */
'use strict';

var LangOptimizer = require("broccoli-css-lang-optimizer");

module.exports = {
  name: 'ember-cli-css-lang-optimizer',

  setupPreprocessorRegistry: function(type, registry) {
    var addon = this;
    registry.add('css', {
      name: 'lang-optimizer',
      ext: 'css',
      toTree: function(tree, inputPath, outputPath, options) {
        var config = addon.project.config(addon.app.env).langOptimizer || {};
        var tree = new LangOptimizer(tree, config); 
        return tree;
      }
    });
  }
};
