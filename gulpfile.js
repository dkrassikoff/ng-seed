var gulp = require('gulp');
var del = require('del');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var $ = require('gulp-load-plugins')({lazy:true});
var port = process.env.PORT || config.defaultPort;

gulp.task('optimize', ['inject', 'styles', 'templatecache', 'wiredep'], function() {
	log('Optimize the javascript, css, html');
	var assets = $.useref.assets({searchPath : './'});
	var templateCache = config.temp + config.templateCache.file;
	var cssFilter = $.filter('**/*.css', {restore: true});
	var jsFilter = $.filter('**/*.js', {restore: true});

	return gulp
		.src(config.index)
		.pipe($.plumber())
		.pipe($.inject(gulp.src(templateCache, {read: false}), 
			{starttag: '<!-- inject:templates:js -->'}))
		.pipe(assets)
		.pipe(cssFilter)
		.pipe($.csso())
		.pipe(cssFilter.restore)
		.pipe(assets.restore())
		.pipe(jsFilter)
		.pipe($.uglify())
		.pipe(jsFilter.restore)
		.pipe($.rev())
		.pipe($.useref())
		.pipe($.revReplace())
		.pipe(gulp.dest(config.build));
});

gulp.task('serve-build', ['optimize'], function() {
	serve(false);
});

gulp.task('serve-dev', ['inject', 'styles', 'templatecache', 'wiredep'], function() {
	serve(true);
});

gulp.task('wiredep', function() {
	log('Wire up bower css, bower js and app js into index html');
	var options = config.getWiredepDefaultOptions();
	var wiredep = require('wiredep').stream;

	return gulp
		.src(config.index)
		.pipe(wiredep(options))
		.pipe($.inject(gulp.src(config.js)))
		.pipe(gulp.dest(config.client));
});

gulp.task('inject', ['styles'], function() {
	log('Wire up the app css into index html and call wiredep');
	
	return gulp
		.src(config.index)
		.pipe($.inject(gulp.src(config.css)))
		.pipe(gulp.dest(config.client));
});

gulp.task('templatecache', ['clean-code'], function() {
	log('Creating AngularJS $templateCache');
	return gulp
		.src(config.htmltemplates)
		.pipe($.minifyHtml({empty:true}))
		.pipe($.angularTemplatecache(
			config.templateCache.file,
			config.templateCache.options
			))
		.pipe(gulp.dest(config.temp));
});

gulp.task('sass-watcher', [], function() {
	gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('fonts', ['clean-fonts'], function() {
	log('Copying Fonts');
	return gulp
		.src(config.fonts)
		.pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function() {
	log('Copying Images');
	return gulp
		.src(config.images)
		.pipe($.imagemin({optimizationLevel:4}))
		.pipe(gulp.dest(config.build + 'images'));
});

gulp.task('styles', ['clean-styles'], function() {
	log('Compiling Sass to CSS');
	
	return gulp
		.src(config.sass)
    	.pipe($.plumber())
    	.pipe($.sass().on('error', $.sass.logError))
    	.pipe($.sass({outputStyle: 'expanded'}))
    	.pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
    	.pipe(gulp.dest(config.temp));
});

gulp.task('clean-code', function() {
	var files = [].concat(
		config.build + '**/*.js',
		config.build + 'js/**/*.js',
		config.build + '**/*.html'
	);
	return clean(files);
});

gulp.task('clean-fonts', function() {
	return clean(config.build + 'fonts/**/*.*');
});

gulp.task('clean-images', function() {
	return clean(config.build + 'images/**/*.*');
});

gulp.task('clean-styles', function() {
	return clean(config.temp + '**/*.css');
});

gulp.task('clean', function() {
	var delconfig = [].concat(config.build, config.temp);
	return del(delconfig);
});

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

//

function serve(isDev) {
	var nodeOptions = {
		script: config.nodeServer,
		delayTime: 1,
		env: {
			'PORT': port,
			'NODE_ENV': isDev ? 'dev' : 'build'
		},
		watch: [config.server]
	};
	return $.nodemon(nodeOptions)
		.on('restart', function(ev) {
			log('** nodemon restarted **');
			log('files changed on restart:\n');
			setTimeout(function() {
				browserSync.notify('reloading now ...');
				browserSync.reload({stream: false});
			}, config.browserReloadDelay);
		})
		.on('start', function(ev) {
			log('** nodemon started **');
			startBrowserSync(isDev);
		})
		.on('crash', function(ev) {
			log('** nodemon crashed **');
		})
		.on('exit', function(ev) {
			log('** nodemon exited **');
		});
}

function startBrowserSync(isDev) {
	if (args.nosync || browserSync.active) {
		return;
	}
	if(isDev) {
		gulp.watch([config.sass], ['styles'])
			.on('change', function(event) {changeEvent(event);});
	} else {
		gulp.watch([config.sass, config.js, config.html], ['optimize', browserSync.reload])
			.on('change', function(event) {changeEvent(event);});
	}

	log('Starting browser-sync on port ' + port);
	var options = {
		proxy: 'localhost:' + port,
		port: 3000,
		files: isDev ? [
			config.client + '**/*.*',
			'!' + config.sass,
			config.temp + '**/*.css'
		] : [],
		ghostMode: {
			clicks: true,
			location: false,
			forms: true,
			scroll: true
		},
		injectChanges: true,
		logFileChanges: true,
		logLevel: 'debug',
		logPrefix: 'gulp-patterns',
		notify: true,
		reloadDelay: 1000
	};
	browserSync(options);
};

function changeEvent(event) {
	var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
	log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function clean(path) {
	log('Cleaning: ' + $.util.colors.blue(path));
	return del(path);
};

function log(msg)  {
	if (typeof (msg) === 'object') {
		for (var item in msg) {
			if (msg.hasOwnProperty(item)) {
				$.util.log(util.colors.blue(msg[item]));
			}
		}
	} else {
		$.util.log($.util.colors.blue(msg));
	}
};