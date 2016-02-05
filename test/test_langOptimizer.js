/* Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 */

"use strict";

var assert = require("assert");
var path = require("path");
var fs = require("fs");
var broccoli = require("broccoli");
var RSVP = require("rsvp");
var glob = require("glob");

RSVP.on("error", function(reason, label) {
  if (label) {
    console.error(label);
  }

  console.assert(false, reason.message);
});


var LangOptimizer = require("../lib/langOptimizer");

function fixtureSourceDir(name) {
  return path.resolve(__dirname, "fixtures", name, "input");
}

function fixtureOutputDir(name) {
  return path.resolve(__dirname, "fixtures", name, "output");
}


function build(builder) {
  return RSVP.Promise.resolve()
  .then(function() {
    return builder.build();
  })
  .then(function(hash) {
    return builder.tree.outputPath;
  });
}

function diffDirs(actualDir, expectedDir, callback) {
  var actualFiles = glob.sync("**/*", {cwd: actualDir}).sort();
  var expectedFiles = glob.sync("**/*", {cwd: expectedDir}).sort();
  assert.deepEqual(actualFiles, expectedFiles);
  actualFiles.forEach(function(file) {
    var actualPath = path.join(actualDir, file);
    var expectedPath = path.join(expectedDir, file);
    var stats = fs.statSync(actualPath);
    if (stats.isFile()) {
      assert.equal(fs.readFileSync(actualPath).toString(),
                   fs.readFileSync(expectedPath).toString());
    }
  });
  callback();
}


describe("LangOptimizer", function () {
  it("can be instantiated", function (done) {
    var optimizer = new LangOptimizer(fixtureSourceDir("basicProject"));
    assert(optimizer instanceof LangOptimizer);
    done();
  });

  it("can be instantiated by function call", function (done) {
    var optimizer = LangOptimizer(fixtureSourceDir("basicProject"));
    assert(optimizer instanceof LangOptimizer);
    done();
  });

  it("splits css up by languages", function (done) {
    var optimizer = LangOptimizer(fixtureSourceDir("basicProject"), {includeBaseFile: false});
    var builder = new broccoli.Builder(optimizer);

    build(builder)
      .then(function(outputDir) {
        diffDirs(outputDir, fixtureOutputDir("basicProject"), function() {
          done();
        });
      });
  });

  it("includes the base file by default", function (done) {
    var optimizer = LangOptimizer(fixtureSourceDir("includesBaseFile"));
    var builder = new broccoli.Builder(optimizer);

    build(builder)
      .then(function(outputDir) {
        diffDirs(outputDir, fixtureOutputDir("includesBaseFile"), function() {
          done();
        });
      });
  });

  it("allows custom filenames", function (done) {
    var optimizer = LangOptimizer(fixtureSourceDir("customFilenames"), {
      includeBaseFile: false,
      filenameForLang: function(baseFilename, lang) {
         return baseFilename.replace(".css", "-" + lang + ".css");
      }
    });
    var builder = new broccoli.Builder(optimizer);

    build(builder)
      .then(function(outputDir) {
        diffDirs(outputDir, fixtureOutputDir("customFilenames"), function() {
          done();
        });
      });
  });

  it("allows specified langs", function (done) {
    var optimizer = LangOptimizer(fixtureSourceDir("specifiedLangs"), {
      langs: ["en", "zh"]
    });
    var builder = new broccoli.Builder(optimizer);

    build(builder)
      .then(function(outputDir) {
        diffDirs(outputDir, fixtureOutputDir("specifiedLangs"), function() {
          done();
        });
      });
  });

  it("flips rtl langs", function (done) {
    var optimizer = LangOptimizer(fixtureSourceDir("rtlLangs"), {
      rtlLangs: ["ar"]
    });
    var builder = new broccoli.Builder(optimizer);

    build(builder)
      .then(function(outputDir) {
        diffDirs(outputDir, fixtureOutputDir("rtlLangs"), function() {
          done();
        });
      });
  });
});
