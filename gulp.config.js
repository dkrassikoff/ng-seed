module.exports = function() {
	var client = './src/client/';
	var clientApp = client + 'app/';
	var server = './src/server/';
	var temp = './.tmp/';

	var config = {
		alljs: [
			'./src/**/*.js',
			'./*.js'
		],
		build: './build/',
		client: client,
		css: temp + 'styles.css',
		//fonts:
		html: clientApp + '**/*.html',
		htmltemplates: clientApp + '**/*.html',
		images: client + 'images/**/*.*',
		index: client + 'index.html',
		js: [
			clientApp + '**/*.module.js',
			clientApp + '**/*.js'
		],
		sass: client + 'styles/styles.sass',
		server: server,
		temp: temp,
		browserReloadDelay: 1000,
		
		bower: {
			json: require('./bower.json'),
			dictionary: './bower_components/',
			ignorePath: '../..'
		},

		defaultPort: 7203,
		nodeServer: server + '/app.js',

		templateCache: {
			file: 'templates.js',
			options: {
				module: 'app.core',
				standAlone: false,
				root: 'app/'
			}
		}

	};

	config.getWiredepDefaultOptions = function() {
		var options = {
			bowerJson: config.bower.json,
			directory: config.bower.directory,
			ignorePath: config.bower.ignorePath
		}
		return options;
	}

	return config;
};