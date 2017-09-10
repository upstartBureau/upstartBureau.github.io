
/////////////////////// IMPORTS /////////////////////////

const gulp = require('gulp'),
      sass = require('gulp-sass'),
      autoprefixer = require('gulp-autoprefixer'),
      browserSync = require('browser-sync').create(),
      runSequence = require('run-sequence');

//////////////////////// SASS ///////////////////////////

gulp.task('sass', function() {
  return gulp.src('./scss/index.scss')
    .pipe(sass({
      outputStyle: 'nested'
    })
    .on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest(`./css/`));
});

gulp.task('watch:sass', function() {
  gulp.watch(['./scss/**/*.scss'], ['sass']);
});

////////////////////// BROWSER-SYNC /////////////////////

gulp.task('browser-sync', function() {
  browserSync.init({
    port: 3000,
    server: './',
    files: ['./js/**', './css/**', 'index.html', './img/**'],
    ui: {
      port: 8090,
      weinre: {
        port: 3200
      }
    }
  });
});

/////////////////////// MAIN TASKS ///////////////////////

gulp.task('default', cb => {
  runSequence('sass', 'watch:sass', 'browser-sync', cb);
});

