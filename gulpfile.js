var gulp       = require('gulp');
var uglify     = require('gulp-uglify');
var livereload = require('gulp-livereload');
var browserify = require('gulp-browserify');
//var stylus     = require('gulp-stylus');



gulp.task('scripts', function() {
    // Single entry point to browserify 
    gulp.src('mithril-toolkit.js')
        .pipe( browserify({insertGlobals:false, debug : true}) )
        .pipe( gulp.dest('./dist') )
        .pipe( livereload() )
});


gulp.task('jade', function () {
    var YOUR_LOCALS = {};
    
    gulp.src('jade/**/*.jade')
        .pipe(jade({
            locals: YOUR_LOCALS
        }))
        .pipe(gulp.dest('./public'))
        .pipe(livereload())
});


gulp.task('default', ['scripts'], function() {
    gulp.watch('src/**/*.js', ['scripts']);
    //gulp.watch('jade/**/*.jade', ['jade']);
    //gulp.watch('stylus/**/*.styl', ['stylus']);

    livereload.listen();
});




