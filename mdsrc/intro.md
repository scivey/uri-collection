
An immutable list container for URIs, with chaining methods for filtering and manipulation.  Built for Node.js on top of [URIjs][urijs] and [Underscore][underscore].

[urijs]: http://medialize.github.io/URI.js/
[underscore]: http://underscorejs.org/


```javascript
var URICollection = require("uri-collection");
var urls = [
	"http://www.justcats.net/fuzz",
	"http://www.foxnews.com/fairandbalanced",
	"http://www.PepsiLovesYourDemographic.com",
	"http://www.reddit.com/r/alsocats",
	"http://www.foxnews.com/nospinzone"
];
var collection1 = new URICollection(urls);

var collection2 = collection1.where( { domain: "foxnews.com" } );

console.log( collection2.toString() );
// output: 
// [ "http://www.foxnews.com/fairandbalanced",
//	"http://www.foxnews.com/nospinzone" ]

```

All operations return new collections, leaving the original collections and their elements intact.  Filter and search operations like `findWhere` have been modified to accomodate the URIjs interface, and compare against the results of method invocation rather than raw property values where appropriate.

The [public API is fully documented][api].  Each method is covered by its own [test suite][tests], and each suite includes tests to verify immutability of existing collections.

[ Read the overview ==>][overview]</span>

[api]:./api.html
[tests]:./spec.html
[overview]:./overview.html
