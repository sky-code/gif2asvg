var gulp = require('gulp');
var $ = require('gulp-load-plugins')({ lazy: false });
var del = require("del");

gulp.task('dist', function() {
    gulp.src([
            './node_modules/omggif/omggif.js',
            './image-info.js',
            './gif2asvg.js'
        ]).pipe($.concat('gif2asvg.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe($.rename('gif2asvg.min.js'))
        .pipe($.uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('clean:dist', function() {
    del('./dist');
});

gulp.task('convert', function () {
    return gulp.src([
        '/convert' + '*.gif'
    ]);
});