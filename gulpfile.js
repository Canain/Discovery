var gulp = require('gulp');
var del = require('del');
var path = require('path');
var runSequence = require('run-sequence');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rename = require("gulp-rename");
var runSequence = require('run-sequence');
var childProcess = require('child_process');
var spawn = childProcess.spawn;
var exec = childProcess.exec;
var serve = require('gulp-serve');
var open = require('gulp-open');

var paths = {
	less: 'src/less/main.less',
	browserify: 'out/ts/main.js',
	js:
		'{' +
			'bower_components/phaser/build/phaser.js,' +
			'out/browserify/bundle.js' +
		'}',
	debug:
		'{' +
			'bower_components/phaser/build/phaser.min.js,' +
			'out/browserify/bundle.js' +
		'}',
	css:
		'{' +
			'out/less/main.css' +
		'}'
};

var isWin = /^win/.test(process.platform);

function getNpmBin(done) {
	exec('npm bin', function(error, stdout, stderr) { 
		npmBin = stdout.toString().trim();
		done();
	});
}

var npmBin;

function run(program, args, done, global) {
	if (npmBin === undefined) {
		getNpmBin(function () {
			run(program, args, done, global);
		});
	} else {
		if (!global) {
			program = npmBin + '/' + program;
		}
		var process;
		if (isWin) {
			args.unshift(program);
			args.unshift('/c');
			process = spawn('cmd', args);
		} else {
			process = spawn(program, args);
		}
		process.stdout.on('data', function (data) {
			var out = data.toString();
			console.log(out.substring(0, out.length - 1));
		});
		process.stderr.on('data', function (data) {
			var out = data.toString();
			console.log(out.substring(0, out.length - 1));
		});
		process.on('exit', function (code) {
			done(code);
		});
	}
}

function getSpacedPath(path) {
	return path.substring(1, path.length - 1).replace(/,/g, ' ');
}

gulp.task('bower', function (done) {
	run('bower', ['install'], done);
});

gulp.task('tsd', function (done) {
	run('tsd', ['install'], done);
});

gulp.task('update', ['bower', 'tsd']);

gulp.task('ts', function (done) {
	run('tsc', [], done);
});

gulp.task('less', function (done) {
	mkdirp('out/less', function (err) {
		run('lessc', [paths.less, '>', 'out/less/main.css'], done);
	});
});

gulp.task('compress-js', function (done) {
	mkdirp('out/dist', function (err) {
		var args = getSpacedPath(paths.js).split(' ');
		args.push('-o', 'out/dist/compiled.js');
		run('uglifyjs', args, done);
	});
});

gulp.task('compress-js-debug', function (done) {
	mkdirp('out/dist', function (err) {
		var args = getSpacedPath(paths.debug).split(' ');
		args.push('-o', 'out/dist/compiled.js', '-b');
		run('uglifyjs', args, done);
	});
});

gulp.task('compress-css', function (done) {
	mkdirp('out/dist', function (err) {
		var args = getSpacedPath(paths.css).split(' ');
		args.unshift('--ugly-comments');
		args.push('>', 'out/dist/compiled.css');
		run('uglifycss', args, done);
	});
});

gulp.task('browserify', function (done) {
	mkdirp('out/browserify', function (err) {
		run('browserify', [paths.browserify, '-o', 'out/browserify/bundle.js'], done);
	});
});

gulp.task('publish-copy-dist', function () {
	return gulp.src('out/dist/**/*').pipe(gulp.dest('out/pub/dist'));
});

gulp.task('publish-copy-root', function () {
	return gulp.src('src/root/**/*').pipe(gulp.dest('out/pub'));
});

gulp.task('publish-retina', function () {
	return gulp.src('out/pub/**/*').pipe(gulp.dest('../retina-ui/public/discovery'));
});

gulp.task('publish', function (done) {
	runSequence(['publish-copy-root', 'publish-copy-dist'], 'publish-retina', done);
});

gulp.task('clean', function (cb) {
	del(['out', '../retina-ui/public/discovery'], {
		force: true
	}, cb);
});

gulp.task('js', function (done) {
	runSequence('ts', 'browserify', 'compress-js', done);
});

gulp.task('js-debug', function (done) {
	runSequence('ts', 'browserify', 'compress-js-debug', done);
});

gulp.task('css', function (done) {
	runSequence('less', 'compress-css', done);
});

gulp.task('build', function (callback) {
	runSequence('clean', ['js', 'css'], 'publish', callback);
});

gulp.task('build-debug', function (callback) {
	runSequence('clean', ['js-debug', 'css'], 'publish', callback);
});

gulp.task('test', function (cb) {
	runSequence('build', 'run');
});

gulp.task('test-debug', function (cb) {
	runSequence('build-debug', 'run');
});

gulp.task('open', function () {
	gulp.src('').pipe(open({uri: 'http://localhost:5000/discovery'}));
});

gulp.task('serve', serve('out/pub'));

gulp.task('run', ['open']);

gulp.task('default', ['run']);