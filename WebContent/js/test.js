describe('Posting Data using angular-pouchdb', function() {
				
  var pouchdb;
  
  function OK(response) {
	    console.log(response);
	    expect(response.ok).toBe(true);
	  }

  function Failed(response) {
    self.fail(response);
  }
	  
  beforeEach(function() 
	{
	    var $injector = angular.injector(['ng', 'pouchdb']);
	    var pouchDB = $injector.get('pouchDB');
	    pouchdb = pouchDB('testdb');
   });
  
  var testTaskData = 
  {
    type: 'TASK',
    title: 'Feedthekitten'
  };
  it('should post test data using angular-pouchdb', function(done) {
	  
	  pouchdb.post(testTaskData)
	      .then(OK)
	      .catch(Failed)
	      .finally(done);
	  });
  
	it('should post some more test data using angular-pouchdb', function(done) {
	  
	  pouchdb.post({type: "Activity", title: "Walking the dog"})
	      .then(OK)
	      .catch(Failed)
	      .finally(done);
	  });
  
});