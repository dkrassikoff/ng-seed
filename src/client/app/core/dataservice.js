(function() {
	'use strict';

	angular
		.module('app.core')
		.factory('dataservice', dataservice);

	dataservice.$inject = ['$http', '$location', '$q', 'exception', 'logger'];
	/* @ngInject */
	function dataservice($http, $location, $q, exception, logger) {
		var readyPromise;

		var service = {
			getItem: getItem,
			getItems: getItems,
			ready: ready
		};

		return service;

		function getItem(id) {
			return $http.get('/api/item/' + id)
				.then(getItemComplete)
				.catch(function(message) {
					exception.catcher('XHR Failed for getItem')(message);
					$location.url('/');
				});

			function getItemComplete(data, status, headers, config) {
				return data.data;
			}
		}

		function getItems() {
			return $http.get('/api/items')
				.then(getItemsComplete)
				.catch(function(message) {
					exception.catcher('XHR Failed for getItems')(message);
					$location.url('/');
				});

			function getItemsComplete(data, status, headers, config) {
				return data.data;
			}
		}

		function getReady() {
			if (!readyPromise) {
				logger.info('Primed the app data');
				readyPromise = $q.when(service);
			}
			return readyPromise;
		}

		function ready(promisesArray) {
			return getReady()
				.then(function() {
					return promisesArray ? $q.all(promisesArray) : readyPromise;
				})
				.catch(exception.catcher('"ready" function failed'));
		}
	}
})();
