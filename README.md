# Summary

Work in progress!

AngularJS module for session management with mCAP backends. Intercepts all $http requests. On unauthorized requests, the request is put into a queue and will be resent as soon as a new valid session exists.

Concept taken from [http://www.espeo.pl/2012/02/26/authentication-in-angularjs-application](http://www.espeo.pl/2012/02/26/authentication-in-angularjs-application). Credits to Witold Szczerba.

Author: Volker Tietz (v.tietz@mwaysolutions.com)

# Installation

`$ bower install mwaylabs/angularjs-mcap-session`

# Usage/Example

```
// Add mCAP.Session module as dependency of your main AngularJS module
angular.module('YourApp', ['mCAP.Session']);

// Set up mCAP.Session config with URLs to service endpoints (see mCAP docs)
mCAP.Session.service('mCAP.Session.config', function () {
  return {
    pingUrl: 'http://path-to.example-mcap.com/gofer/system/security/currentAuthorization',
    loginUrl: 'http://path-to.example-mcap.com/gofer/security-login',
    logoutUrl: 'http://path-to.example-mcap.com/gofer/security-logout'
  };
});

YourApp.run(['$rootScope', function ($rootScope) {

  $rootScope.$on('mcap:loginRequired', function () {
    // e.g. show login form
  });

  $rootScope.$on('mcap:loginConfirmed', function () {
    // Actions on successful login
  });

  $rootScope.$on('mcap:serverWentAway', function () {
    // e.g. show error page
  });

  $rootScope.$on('mcap:ping', function () {
    // e.g. save previous location if someone enters on #/aPath and is redirected to login form to redirect back after successful login
  });

  // Initial session validation check
  $rootScope.$broadcast('mcap:ping');
}]);


// Controller for login form
var LoginController = function($rootScope, $scope){
  $scope.signIn = function() {
    $rootScope.$broadcast('mcap:loginRequest', $scope.organization, $scope.username, $scope.password);
  };
  $scope.$on('mcap:loginDenied', function() {
    $scope.errorMessage = 'Login failed';
  });
};

// Controller for logout
var LogoutController = function($rootScope){
  $rootScope.$broadcast('mcap:logoutRequest');
};
```

# Events

There are several events which are either automatically broadcasted by the module, can be broadcasted to trigger an event or both.

### mcap:ping

Sends a request to the pingUrl endpoint.

**Broadcast** if you want to check if your session is still valid.

### mcap:loginRequest, `organization`, `username`, `password`

Sends the actual login request to the mCAP instance. All parameters are required for the request to be sent.

**Broadcast** with organization name, username and password to log in and create a session.    
**Fires** mcap:loginConfirmed, mcap:loginDenied

### mcap:loginConfirmed

**Listen** if you want to hook something upon a successful login

### mcap:loginDenied

**Listen** if you want to hook something upon a failed login

### mcap:logoutRequest

**Broadcast** to destroy your current session. 
**Fires** mcap:ping

### mcap:serverError

**Listen** if you want to capture



