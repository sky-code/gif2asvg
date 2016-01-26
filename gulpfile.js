var gulp = require('gulp');

gulp.task('convert', function () {
    return gulp.src([
        '/convert' + '*.gif'
    ]);
});