module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    release: {
      options: {
        tagName: 'ember-addon-<%= version %>'
      }
    }
  });
  grunt.loadNpmTasks("grunt-release");

  grunt.registerTask("default", []);
};
