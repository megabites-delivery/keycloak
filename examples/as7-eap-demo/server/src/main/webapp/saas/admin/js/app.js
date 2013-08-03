'use strict';

var module = angular.module('keycloak', [ 'keycloak.services', 'keycloak.loaders', 'keycloak.controllers', 'ui.bootstrap' ]);
var resourceRequests = 0;

module.config([ '$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/create/application', {
		templateUrl : 'partials/application-detail.html',
		resolve : {
			application : function(ApplicationLoader) {
				return {};
			},
			realms : function(RealmListLoader) {
				return RealmListLoader();
			}
		},
		controller : 'ApplicationDetailCtrl'
	}).when('/applications/:application', {
		templateUrl : 'partials/application-detail.html',
		resolve : {
			application : function(ApplicationLoader) {
				return ApplicationLoader();
			},
			realms : function(RealmListLoader) {
				return RealmListLoader();
			}
		},
		controller : 'ApplicationDetailCtrl'
	}).when('/applications', {
		templateUrl : 'partials/application-list.html',
		resolve : {
			applications : function(ApplicationListLoader) {
				return ApplicationListLoader();
			}
		},
		controller : 'ApplicationListCtrl'
	})
	
	.when('/create/realm', {
		templateUrl : 'partials/realm-detail.html',
		resolve : {
			realm : function(RealmLoader) {
				return {};
			}
		},
		controller : 'RealmDetailCtrl'
	}).when('/realms/:realm', {
		templateUrl : 'partials/realm-detail.html',
		resolve : {
			realm : function(RealmLoader) {
				return RealmLoader();
			}
		},
		controller : 'RealmDetailCtrl'
	}).when('/realms', {
		templateUrl : 'partials/realm-list.html',
		controller : 'RealmListCtrl'
	})
	
	.when('/create/user/:realm', {
		templateUrl : 'partials/user-detail.html',
		resolve : {
			realm : function(RealmLoader) {
				return RealmLoader();
			},
			user : function() {
				return {};
			}
		},
		controller : 'UserDetailCtrl'
	}).when('/realms/:realm/users/:user', {
		templateUrl : 'partials/user-detail.html',
		resolve : {
			realm : function(RealmLoader) {
				return RealmLoader();
			},
			user : function(UserLoader) {
				return UserLoader();
			}
		},
		controller : 'UserDetailCtrl'
	}).when('/realms/:realm/users', {
		templateUrl : 'partials/user-list.html',
		resolve : {
			realm : function(RealmLoader) {
				return RealmLoader();
			},
			users : function(UserListLoader) {
				return UserListLoader();
			}
		},
		controller : 'UserListCtrl'
	})
	
	.when('/realms/:realm/roles', {
		templateUrl : 'partials/role-mapping.html',
		resolve : {
			realm : function(RealmLoader) {
				return RealmLoader();
			},
			application : function() {
				return null;
			},
			users : function() {
				return null;
			},
			role : function() {
				return null;
			}
		},
		controller : 'RoleMappingCtrl'
	}).when('/realms/:realm/roles/:role', {
		templateUrl : 'partials/role-mapping.html',
		resolve : {
			realm : function(RealmLoader) {
				return RealmLoader();
			},
			application : function() {
				return null;
			},
			role : function($route) {
				return $route.current.params.role;
			},
			users : function(RoleMappingLoader) {
				return RoleMappingLoader();
			}
		},
		controller : 'RoleMappingCtrl'
	})
	
	.when('/applications/:application/roles', {
		templateUrl : 'partials/role-mapping.html',
		resolve : {
			realm : function(ApplicationLoader) {
				return ApplicationLoader();
			},
			users : function() {
				return null;
			},
			role : function() {
				return null;
			}
		},
		controller : 'RoleMappingCtrl'
	}).when('/applications/:application/roles/:role', {
		templateUrl : 'partials/role-mapping.html',
		resolve : {
			realm : function(ApplicationLoader) {
				return ApplicationLoader();
			},
			role : function($route) {
				return $route.current.params.role;
			},
			users : function(RoleMappingLoader) {
				return RoleMappingLoader();
			}
		},
		controller : 'RoleMappingCtrl'
	})
	
	.otherwise({
		templateUrl : 'partials/home.html'
	});
} ]);

module.config(function($httpProvider) {
	$httpProvider.responseInterceptors.push('errorInterceptor');

	var spinnerFunction = function(data, headersGetter) {
		if (resourceRequests == 0) {
			$('#loading').show();
		}
		resourceRequests++;
		return data;
	};
	$httpProvider.defaults.transformRequest.push(spinnerFunction);

	$httpProvider.responseInterceptors.push('spinnerInterceptor');

});

module.factory('errorInterceptor', function($q, $window, $rootScope, $location) {
	return function(promise) {
		return promise.then(function(response) {
			$rootScope.httpProviderError = null;
			return response;
		}, function(response) {
			$rootScope.httpProviderError = response.status;
			return $q.reject(response);
		});
	};
});

module.factory('spinnerInterceptor', function($q, $window, $rootScope, $location) {
	return function(promise) {
		return promise.then(function(response) {
			resourceRequests--;
			if (resourceRequests == 0) {
				$('#loading').hide();
			}
			return response;
		}, function(response) {
			resourceRequests--;
			if (resourceRequests == 0) {
				$('#loading').hide();
			}

			return $q.reject(response);
		});
	};
});

module.directive('kcInput', function() {
	var d = {
		scope : true,
		replace : false,
		link : function(scope, element, attrs) {
			var form = element.closest('form');
			var label = element.children('label');
			var input = element.children('input');

			var id = form.attr('name') + '.' + input.attr('name');

			element.attr('class', 'control-group');

			label.attr('class', 'control-label');
			label.attr('for', id);

			input.wrap('<div class="controls"/>');
			input.attr('id', id);

			if (!input.attr('placeHolder')) {
				input.attr('placeHolder', label.text());
			}

			if (input.attr('required')) {
				label.append(' <span class="required">*</span>');
			}
		}
	};
	return d;
});

module.directive('kcEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.kcEnter);
				});

				event.preventDefault();
			}
		});
	};
});

module.filter('remove', function() {
	return function(input, remove, attribute) {
		if (!input || !remove) {
			return input;
		}

		var out = [];
		for ( var i = 0; i < input.length; i++) {
			var e = input[i];

			for (var j = 0; j < remove.length; j++) {
				if (attribute) {
					if (remove[j][attribute] == e[attribute]) {
						e = null;
						break;
					}
				} else {
					if (remove[j] == e) {
						e = null;
						break;
					}
				}
			}

			if (e != null) {
				out.push(e);
			}
		}

		return out;
	};
});