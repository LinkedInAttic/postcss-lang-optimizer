/* Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 */

/* jshint node: true */
"use strict";

var PostCSSFilter = require("broccoli-postcss-sourcemaps");
var langOptimizer = require("postcss-lang-optimizer");

function LangOptimizer(inputNode, options) {
  if ( !(this instanceof LangOptimizer) ) {
    return new LangOptimizer(inputNode, options);
  }

  this.optimizerOpts = options || {};
  var postCSSOptions = {
    plugins: [
      {
      module: langOptimizer,
      options: {subtags: this.optimizerOpts.subtags}
    }
    ],
    resultHandler: this.resultHandler.bind(this)
  };

  PostCSSFilter.call(this, inputNode, postCSSOptions);
}

LangOptimizer.prototype = Object.create(PostCSSFilter.prototype);
LangOptimizer.prototype.constructor = LangOptimizer;

LangOptimizer.prototype.resultHandler = function(result, filter, relativePath, addOutputFile) {
  var options = this.optimizerOpts;
  var langResults = langOptimizer.extractAll(result);
  var langs = options.langs ? options.langs : Object.keys(langResults);
  if (typeof langs === "function") {
    langs = langs();
  }
  langs.forEach(function (lang) {
    var langFilename, langCSS;
    if (options.filenameForLang) {
      langFilename = options.filenameForLang(relativePath, lang);
    } else {
      langFilename = relativePath.replace(".css", "_" + lang + ".css");
    }
    if (options.includeBaseFile || typeof options.includeBaseFile === "undefined") {
      if (langResults[lang]) {
        langCSS = result.css + "\n" + langResults[lang] + "\n";
      } else {
        langCSS = result.css;
      }
    } else {
      if (langResults[lang]) {
        langCSS = langResults[lang] + "\n";
      }
    }
    addOutputFile(langCSS, langFilename);
  });
};

module.exports = LangOptimizer;