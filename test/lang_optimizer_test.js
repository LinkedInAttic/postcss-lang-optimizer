/* Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 */

var fs = require("fs");
var path = require("path");
var postcss = require("postcss");
var assert = require("assert");

var langOptimizer = require("../lib/index");

function read(path) {
  return fs.readFileSync(path, 'utf-8');
}

function assertOutput(name, lang, opts) {
  var output;
  var validTags = opts.validTags;
  delete opts.validTags;
  var input  = read(path.join(__dirname, 'fixtures/' + name + '.css'));
  var result = postcss(langOptimizer(opts)).process(input);
  if (lang == "base") {
    output = result.css;
  } else {
    if (validTags) {
      for (var i = 0; i < result.messages.length; i++) {
        if (result.messages[i].type === "lang-optimization") {
          var found = false;
          for (var t = 0; t < validTags.length; t++) {
            if (result.messages[i].language == validTags[t]) {
              found = true;
              break;
            }
          }
          if (!found) {
            assert.fail(result.messages[i].language + " is not a valid language. Expected one of: " +
                        validTags.join(", "));
          }
        }
      }
    }
    output = langOptimizer.extract(result, lang) || "";
  }
  var expected = read(path.join(__dirname, 'fixtures/' + name + '_' + lang + '.expected.css'));
  assert.equal(output.trim(), expected.trim());
};


describe("postcss-lang-optimizer", function() {
  it("removes language specific selectors from the base file", function() {
    assertOutput("basic/main", "base", {validTags: ["en"]});
  });

  it("extracts language specific selectors to a language file", function() {
    assertOutput("basic/main", "en", {validTags: ["en"]});
  });

  it("ignores locale regions by default", function() {
    assertOutput("regions/ignored", "base", {validTags: ["en"]});
    assertOutput("regions/ignored", "en", {validTags: ["en"]});
  });

  it("can optimize by region when enabled", function() {
    assertOutput("regions/optimized", "base", {subtags: true, validTags: ["en", "en-us"]});
    assertOutput("regions/optimized", "en", {subtags: true, validTags: ["en", "en-us"]});
    assertOutput("regions/optimized", "en-us", {subtags: true, validTags: ["en", "en-us"]});
  });

  it("wildcard langs are left in the base file.", function() {
    assertOutput("wildcards/main", "base", {validTags: []});
  });

  it("supports media queries", function() {
    assertOutput("basic/directives", "base", {validTags: ["en"]});
    assertOutput("basic/directives", "en", {validTags: ["en"]});
  });

  it("can preserve lang-specific selectors with magic comments", function() {
    assertOutput("preserved/main", "base", {validTags: ["en"]});
    assertOutput("preserved/main", "en", {validTags: ["en"]});
  });

  it("only outputs one message per lang", function() {
    var input  = read(path.join(__dirname, 'fixtures/basic/repeated_lang.css'));
    var result = postcss(langOptimizer({})).process(input);
    assert.equal(result.messages.length, 1);
  });


  describe("helpers", function() {
    it("can extract all languages at once", function() {
      var input = ".foo { color: red; }\n" +
                  ".foo:lang(en) { color: blue; }\n" +
                  ".foo:lang(de) { color: green; }\n";
      var result = postcss(langOptimizer({})).process(input)
      var langs = langOptimizer.extractAll(result);
      assert.deepEqual(Object.keys(langs), ["en", "de"]);
    });
  });
});
