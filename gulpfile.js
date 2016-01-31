var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: false });
var del = require("del");

gulp.task('dist', ['dist:build']);

gulp.task('dist:build', ['dist:transpiling'], function(cb) {
    gulp.src([
            //'./node_modules/omggif/omggif.js',
            './dist/image-info.js',
            './dist/gif2asvg.js'
        ])
        .pipe($.sourcemaps.init())
        .pipe($.concat('gif2asvg.full.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe($.rename({ suffix: '.min' }))
        .pipe($.uglify())
        .pipe($.sourcemaps.write("."))
        .pipe(gulp.dest('./dist'));
    cb();
});

gulp.task('dist:transpiling', function(cb) {
    gulp.src([
            //'./node_modules/omggif/omggif.js',
            './image-info.js',
            './gif2asvg.js'
        ])
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write("."))
        .pipe(gulp.dest('./dist'));
    cb();
});

gulp.task('clean:dist', function() {
    del('./dist');
});

gulp.task('convert', function () {
    return gulp.src([
        '/convert' + '*.gif'
    ]);
});