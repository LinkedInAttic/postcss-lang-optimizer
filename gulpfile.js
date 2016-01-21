// Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.  You may obtain a copy of
// the License at http://www.apache.org/licenses/LICENSE-2.0
//  
// Unless required by applicable law or agreed to in writing, software distributed under
// the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied.

var gulp = require('gulp');

gulp.task('lint', function () {
    var jshint = require('gulp-jshint');
    return gulp.src(['index.js', 'test/*.js', 'gulpfile.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('test', function () {
    var mocha = require('gulp-mocha');
    return gulp.src('test/**/*_test.js', { read: false }).pipe(mocha());
});

gulp.task('default', ['lint', 'test']);
