'use strict';

var mCAP = mCAP || {};
mCAP.Session = angular.module('mCAP.Session', []);

var serverWentAwayResponses = [500, 502, 503, 404];
var unauthorizedResponses = [403];

var mCAPSessionInterceptor = ['$httpProvider', function ($httpProvider) {
  var interceptor = ['$rootScope', '$q', function (rootScope, $q) {
    function success(response) {
      return response;
    }

    function error(response) {
      var status = response.status;
      var deferred = $q.defer();

      // Broadcast mcap:serverWentAway if something on serverside goes wrong
      if (serverWentAwayResponses.indexOf(status) !== -1) {
        rootScope.$broadcast('mcap:serverWentAway');
        return deferred.promise;

        // Broadcast mcap:loginRequired server responds with 403
      } else if (unauthorizedResponses.indexOf(status) !== -1) {
        var req = {
          config:response.config,
          deferred:deferred
        };
        rootScope.unauthorizedRequests.push(req);
        rootScope.$broadcast('mcap:loginRequired');
        return deferred.promise;
      }
      return $q.reject(response);
    }

    return function (promise) {
      return promise.then(success, error);
    };
  }];
  $httpProvider.responseInterceptors.push(interceptor);
}];
mCAP.Session.config(mCAPSessionInterceptor);

mCAP.Session.run(['$rootScope', '$location', '$http', '$log', 'mCAP.Session.config', function ($rootScope, $location, $http, $log, config) {
  /**
   * Holds all the requests which failed due to 401/403 response.
   */
  $rootScope.unauthorizedRequests = [];

  /**
   * On 'mcap:loginRequest' send credentials to the server.
   */
  $rootScope.$on('mcap:loginRequest', function (event, organization, username, password) {
    $log.info('mcap:loginRequest');
    var params = { 'j_organization':organization, 'j_username':username, 'j_password':password };
    $http({method:'POST', url:config.loginUrl, params:params})
        .success(function (data) {
          if (data === 'success') {
            $rootScope.$broadcast('mcap:loginConfirmed');
          } else {
            $rootScope.$broadcast('mcap:loginDenied');
          }
        })
        .error(function () {
          $rootScope.$broadcast('mcap:loginDenied');
        });
  });

  /**
   * On 'mcap:loginConfirmed', resend all the 401 requests.
   */
  $rootScope.$on('mcap:loginConfirmed', function () {
    $log.info('on mcap:loginConfirmed');
    var i, requests = $rootScope.unauthorizedRequests;
    for (i = 0; i < requests.length; i++) {
      $http(requests[i].config).then(function (response) {
        if (requests[i]) {
          requests[i].deferred.resolve(response);
        }
      });
    }
    $rootScope.requests401 = [];
  });

  /**
   * On 'logoutRequest' invoke logout on the server and trigger ping to show login form
   */
  $rootScope.$on('mcap:logoutRequest', function () {
    $log.info('mcap:logoutRequest');
    $http.post(config.logoutUrl).then(function () {
      $rootScope.$broadcast('mcap:ping');
    });
  });

  /**
   * Ping server to figure out if user is already logged in.
   */
  $rootScope.$on('mcap:ping', function () {
    $log.info('mcap:ping');
    $http.get(config.pingUrl).success(function (response) {
      if (response.name !== null) {  // Username is null if user is not logged in
        $rootScope.$broadcast('mcap:loginConfirmed');
      } else {
        $rootScope.$broadcast('mcap:loginRequired');
      }
    });
  });
}]);