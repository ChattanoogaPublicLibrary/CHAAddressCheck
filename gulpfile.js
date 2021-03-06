'use strict';

var gulp = require('gulp');


// load plugins
var $ = require('gulp-load-plugins')([]);

// This isn't quite working with the load-plugins lib?
// load it manually then.
var tsc = require('gulp-typescript-compiler');

var gutil = require('gulp-load-utils')(['log']);

gulp.task('styles', function () {
  return gulp.src('app/styles/global.scss')
    .pipe($.rubySass({
      style: 'expanded',
      precision: 10
    }))
    .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size());
});

gulp.task('scripts', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter(require('jshint-stylish')))
    .pipe($.size());
});

gulp.task('type-scripts', function () {
  return gulp.src('app/scripts/**/*.ts')
    .pipe(tsc({
      module: 'amd',
      target: 'ES5',
      sourcemap: false,
      logErrors: true
    }))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.size());
});

// Doesn't appear to be copying compiled typescripts otherwise?
gulp.task('copy-type-scripts-to-build', function () {
  return gulp.src('app/scripts/**/*.ts')
    .pipe(tsc({
      module: 'amd',
      target: 'ES5',
      sourcemap: false,
      logErrors: true
    }))
    .pipe(gulp.dest('dist/scripts/'))
});

gulp.task('html', ['type-scripts', 'styles', 'scripts'], function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src('app/*.html')
    .pipe($.useref.assets({searchPath: '{.tmp,app}'})).on("error", gutil.log)
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe($.rev())
    .pipe($.useref.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size());
});

// gulp.task('bower-fonts', function () {
//   return $.bowerFiles()
//     .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
//     .pipe($.flatten())
//     .pipe(gulp.dest('dist/fonts'))
//     .pipe($.size());
// });

gulp.task('cha-type', function () {
  return gulp.src(['app/fonts/**/*.*'], { dot: true })
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('geojson', function () {
  return gulp.src(['app/geo/*.*'], { dot: true })
    .pipe(gulp.dest('dist/geo'));
});

gulp.task('extras', function () {
  return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', ['html','copy-type-scripts-to-build', 'images', 'cha-type', 'geojson', 'extras']);

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});

gulp.task('connect', function () {
  var connect = require('connect');
  var app = connect()
    .use(require('connect-livereload')({ port: 35729 }))
    .use(connect.static('app'))
    .use(connect.static('.tmp'))
    .use(connect.directory('app'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect', 'styles', 'type-scripts'], function () {
  require('opn')('http://localhost:9000');
});

// inject bower components
// gulp.task('wiredep', function () {
//   var wiredep = require('wiredep').stream;

//   gulp.src('app/styles/*.scss')
//     .pipe(wiredep({
//       directory: 'app/bower_components'
//     }))
//     .pipe(gulp.dest('app/styles'));

//   gulp.src('app/*.html')
//     .pipe(wiredep({
//       directory: 'app/bower_components'
//     }))
//     .pipe(gulp.dest('app'));
// });

gulp.task('watch', ['connect', 'serve'], function () {
  var server = $.livereload();

  // watch for changes

  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    '{.tmp,app}/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', function (file) {
    server.changed(file.path);
  });

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.ts', ['type-scripts']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch('app/images/**/*', ['images']);
  // gulp.watch('bower.json', ['wiredep']);
});
