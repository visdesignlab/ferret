var gulp = require('gulp');

var gulpSass = require('gulp-sass')(require('sass'));
var browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
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
    return gulp
        .src(paths.pages)
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
});

var compileJS = () => {
    return watchedBrowserify
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
};

gulp.task('compileJS', compileJS);

gulp.task('css', () => {
    return gulp
        .src('src/scss/**/*.{scss,sass}')
        .pipe(gulpSass().on('error', gulpSass.logError))
        .pipe(cleanCSS({ batch: true }))
        .pipe(concat('style.css'))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
});

gulp.task('watch', function () {
    gulp.watch('src/*.html', gulp.series('copy-html'));
    gulp.watch('src/scss/*.scss', gulp.series('css'));
});

gulp.task('initServer', function () {
    browserSync.init({
        server: './dist',
        logFileChanges: false
    });
});

gulp.task(
    'default',
    gulp.series(
        'copy-html',
        'css',
        'compileJS',
        gulp.parallel('initServer', 'watch')
    )
);

watchedBrowserify.on('update', compileJS);
watchedBrowserify.on('log', fancy_log);
