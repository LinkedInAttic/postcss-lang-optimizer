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
  var input  = read(path.join(__dirname, 'fixtures/' + name + '.css'));
  var result = postcss(langOptimizer(opts)).process(input);
  if (lang == "base") {
    output = result.css;
  } else {
    for (var i = 0; i < result.messages.length; i++) {
      if (result.messages[i].type === "lang-optimization" && result.messages[i].language == lang) {
        output = result.messages[i].root.toResult({}).css
        break;
      }
    }
    if (!output) {
      output = "";
    }
  }
  var expected = read(path.join(__dirname, 'fixtures/' + name + '_' + lang + '.expected.css'));
  assert.equal(output.trim(), expected.trim());
};


describe("postcss-lang-optimizer", function() {
  it("removes language specific selectors from the base file", function() {
    assertOutput("basic/main", "base");
  });

  it("removes language specific selectors from to a language file", function() {
    assertOutput("basic/main", "en");
  });
});
