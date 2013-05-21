'use strict';

var mCAP = mCAP || {};
mCAP.Session = angular.module('MCAP.Session', []);

var serverWentAwayResponses = [500, 502, 503, 404];
var serverWentAwayInterceptor = ['$httpProvider', function ($httpProvider) {
  var interceptor = ['$rootScope', '$q', function (rootScope, $q) {
    function success(response) { return response;}
    function error(response) {
      // Broadcast mcap:serverWentAway if something on serverside goes wrong
      if(serverWentAwayResponses.indexOf(response.status) != -1) {
        var deferred = $q.defer();
        rootScope.$broadcast('mcap:serverWentAway');
        return deferred.promise;
      }
      return $q.reject(response);
    }
    return function (promise) { return promise.then(success, error); };
  }];
  $httpProvider.responseInterceptors.push(interceptor);
}];
MCAP.Session.config(serverWentAwayInterceptor);