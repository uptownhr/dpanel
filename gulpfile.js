const gulp = require('gulp'),
  babel = require('gulp-babel')
watch = require('gulp-watch')

gulp.task('babel', function(){
  return gulp.src('src/**/**')
    .pipe(babel())
    .pipe(gulp.dest('bin/'))
})

gulp.task('watch', function(){
  return gulp.watch('src/**/**', ['babel'])
})