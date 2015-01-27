////////////////////////////////////////////////////////////////////
var c = console.log.bind(console);

var tools = {

        ////////////////////////////////////////////////////////////////////////////////
        isEmpty: function(obj) {
        	for(var prop in obj) {
        		if(obj.hasOwnProperty(prop))
        			return false;
        	}

        	return true;
        },

        ////////////////////////////////////////////////////////////////////////////////
        isArray: function(obj) {
        	return Object.prototype.toString.call(obj) === '[object Array]';
        },

		////////////////////////////////////////////////////////////////////////////////
		contains: function(array, value) {
			var i = array.length;
			while (i--) {
				if (array[i] === value) {
					return true;
				}
			}
			return false;
		},

		////////////////////////////////////////////////////////////////////////////////
		startsWith: function(string, search) {
			return string.lastIndexOf(search, 0) === 0;
		},

		////////////////////////////////////////////////////////////////////////////////
		countKeys: function(obj) {
			var count = 0;
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					++count;
				}
			}
			return count;
		},

		////////////////////////////////////////////////////////////////////////////////
		getKeys: function(obj) {
			var keys = [];
			for (var key in obj) {
				keys.push(key);
			}
			return keys;
		},

		////////////////////////////////////////////////////////////////////////////////
		convertCompletionFlagToString: function(completionFlag) {
			if (completionFlag === config.COMPLETION_FLAG_NOT_AVAILABLE_FOR_DAY) {
				return "not available for day";
			}
			else if (completionFlag === config.COMPLETION_FLAG_NO_DATA) {
				return "no data";
			}
			else if (completionFlag === config.COMPLETION_FLAG_NO_CPL_DATA) {
				return "no cpl data";
			}
			else if (completionFlag === config.COMPLETION_FLAG_FLAG_FETCHED) {
				return "fetched";
			}
			else if (completionFlag === config.COMPLETION_FLAG_FLAG_COMPUTED) {
				return "computed";
			}
			else if (completionFlag === config.COMPLETION_FLAG_CHECKED_OK) {
				return "checked ok";
			}
			else if (completionFlag === config.COMPLETION_FLAG_CHECKED_KO) {
				return "checked ko";
			}
			else {
				return "unknown";
			}
		},

		////////////////////////////////////////////////////////////////////////////////
		serializeData: function (data) { 

			if ( ! angular.isObject( data ) ) { 
				return( ( data == null ) ? "" : data.toString() ); 
			}

			var buffer = [];


			for ( var name in data ) { 
				if ( ! data.hasOwnProperty( name ) ) { 
					continue; 
				}

				var value = data[ name ];

				buffer.push(
					encodeURIComponent( name ) + "=" + encodeURIComponent( ( value == null ) ? "" : value )
					); 
			}


			var source = buffer.join( "&" ).replace( /%20/g, "+" ); 
			return( source ); 
		},

		////////////////////////////////////////////////////////////////////////////////
		goToIndex: function()
		{
			location.href = "index.html";
		},

		////////////////////////////////////////////////////////////////////////////////
		truncateString: function(theString, size) {
			if(theString.length > size) {
				return theString.substring(0,size)+"...";
			}
			else {
				return theString;
			}
		}
	};