var gulp = require('gulp');

var gulpSass = require('gulp-sass')(require('sass'));

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var tsify = require('tsify');
var fancy_log = require('fancy-log');
var paths = {
    pages: ['src/*.html']
};

var watchedBrowserify = watchify(
    browserify({
        basedir: '.',
        debug: true,
        entries: ['src/main.ts'],
        cache: {},
        packageCache: {}
    }).plugin(tsify)
);

gulp.task('copy-html', function () {
    return gulp.src(paths.pages).pipe(gulp.dest('dist'));
});

gulp.task('autoprefixer', () => {
    const autoprefixer = require('autoprefixer');
    const sourcemaps = require('gulp-sourcemaps');
    const postcss = require('gulp-postcss');

    return gulp
        .src('src/scss/*.css')
        .pipe(sourcemaps.init())
        .pipe(postcss([autoprefixer()]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'));
});

function bundle() {
    return watchedBrowserify
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist'));
}

gulp.task('css', () => {
    return gulp
        .src('src/scss/**/*.{scss,sass}')
        .pipe(gulpSass().on('error', gulpSass.logError))
        .pipe(gulp.dest('dist/css'));
});

// function css() {
//     return gulp
//         .src('src/scss/**/*.{scss,sass}')
//         .pipe(gulpSass().on('error', gulpSass.logError))
//         .pipe(gulp.dest('dist/css'));
// }

gulp.task('watch', function () {
    gulp.watch('src/*.html', gulp.series('copy-html'));
    gulp.watch('src/scss/*.scss', gulp.series('css'));
});

gulp.task(
    'default',
    gulp.series(
        gulp.parallel('copy-html'),
        gulp.series('css'),
        bundle,
        gulp.parallel('watch')
    )
);
watchedBrowserify.on('update', bundle);
watchedBrowserify.on('log', fancy_log);
