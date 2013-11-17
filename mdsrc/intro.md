
An immutable list container for URIs, with chaining methods for filtering and manipulation.  Built for Node.js on top of [URIjs][urijs] and [Underscore][underscore].

[urijs]: http://medialize.github.io/URI.js/
[underscore]: http://underscorejs.org/


```javascript
var URICollection = require("uri-collection");
var urls = [
	"http://www.justcats.net/fuzz",
	"http://www.foxnews.com/fairandbalanced",
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

All operations return new collections, leaving the original collections and their elements intact.  Filter and search operations like `findWhere` are modified to accomodate URIjs' interface, and compare against methods instead of properties where appropriate.

The [public API is well-documented][api], and each method is covered by its own [test suite][tests].  Each includes tests to verify immutability of existing collections.

[ Read the overview -> ][overview]

[api]:./api.html
[tests]:./spec.html
[overview]:./overview.html
