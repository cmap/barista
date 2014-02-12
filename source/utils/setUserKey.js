// # **setUserKey**

// a utility function to set a user_key attribute on the Barista object and set up
// ajax calls to api.lincscloud.org to pass that user_key as a parameter

// arguments
// 
// 1.  {string}  **key**  The user_key to use or a path to a JSON file containing a user_key attribute, defaults to *""*
Barista.setUserKey = function(key) {
	// grab the user_key from the url given by string passed in 'key' or set the string itself
	// as user_key if an ajax call to the string fails
	var key_request = $.getJSON(key,function(res){
		Barista.user_key = res.user_key;
	},{async: false});
	key_request.fail(function(){
		Barista.user_key = key;
	});

	// configure ajax calls to add the user key parameter on calls to api.lincscloud.org
	key_request.always(function(){
			$.ajaxPrefilter(function( options, originalOptions, jqXHR ){
			var re = new RegExp('api.lincscloud.org');
			if (re.test(options.url)){
				options.data = $.param($.extend(originalOptions.data,{user_key:Barista.user_key}));
			}
		});
	});
};