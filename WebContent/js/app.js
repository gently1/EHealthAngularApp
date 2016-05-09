var myapp = angular.module("ehealthapp", ["ui.router", "pouchdb"]);

myapp.run(function($pouchDB) {
    $pouchDB.setDatabase("my-people-app-db");
    //$pouchDB.sync("http://localhost:4984/test-database");
});

myapp.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state("list", {
            "url": "/list",
            "templateUrl": "templates/list.html",
            "controller": "MainController"
        })
        .state("item", {
            "url": "/item/:documentId/:documentRevision",
            "templateUrl": "templates/item.html",
            "controller": "MainController"
        });
    $urlRouterProvider.otherwise("list");
});

myapp.controller("MainController", function($scope, $rootScope, $state, $stateParams, $pouchDB) {

    $scope.items = {};

    $pouchDB.startListening();

    // Listen for changes which include create or update events
    $rootScope.$on("$pouchDB:change", function(event, data) {
        $scope.items[data.doc._id] = data.doc;
        $scope.$apply();
    });

    // Listen for changes which include only delete events
    $rootScope.$on("$pouchDB:delete", function(event, data) {
        delete $scope.items[data.doc._id];
        $scope.$apply();
    });

    // Look up a document if we landed in the info screen for editing a document
    if($stateParams.documentId) {
        $pouchDB.get($stateParams.documentId).then(function(result) {
            $scope.inputForm = result;
        });
    }

    // Save a document with either an update or insert
    $scope.save = function(firstname, lastname, email) {
        var jsonDocument = {
            "firstname": firstname,
            "lastname": lastname,
            "email": email
        };
        // If we're updating, provide the most recent revision and document id
        if($stateParams.documentId) {
            jsonDocument["_id"] = $stateParams.documentId;
            jsonDocument["_rev"] = $stateParams.documentRevision;
        }
        $pouchDB.save(jsonDocument).then(function(response) {
            $state.go("list");
        }, function(error) {
            console.log("ERROR -> " + error);
        });
    }

    $scope.delete = function(id, rev) {
        $pouchDB.delete(id, rev);
    }
    

});

myapp.service("$pouchDB", ["$rootScope", "$q", "pouchDB",function($rootScope, $q, pouchDB) {

    var database;
    var changeListener;

    this.setDatabase = function(databaseName) {
        database =  pouchDB(databaseName);
    }

    this.startListening = function() {
        changeListener = database.changes({
            live: true,
            include_docs: true
        }).on("change", function(change) {
            if(!change.deleted) {
                $rootScope.$broadcast("$pouchDB:change", change);
            } else {
                $rootScope.$broadcast("$pouchDB:delete", change);
            }
        });
    }

    this.stopListening = function() {
        changeListener.cancel();
    }

    this.sync = function(remoteDatabase) {
        database.sync(remoteDatabase, {live: true, retry: true});
    }

    this.save = function(jsonDocument) {
        var deferred = $q.defer();
        database.post(jsonDocument).then(function(response) {
            deferred.resolve(response);
        }).catch(function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    this.delete = function(documentId, documentRevision) {
        return database.remove(documentId, documentRevision);
    }

    this.get = function(documentId) {
        return database.get(documentId);
    }

    this.destroy = function() {
        database.destroy();
    }

}]);
