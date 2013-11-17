
Node.js: uri-collection
=================
Scott Ivey -> http://www.scivey.net

An immutable list container for URIs, with chaining methods for filtering and manipulation.  Built on top of URIjs and Underscore.

All operations return new collections, leaving the original collections and their elements intact.  Filter and search operations like `findWhere` are modified to accomodate URIjs' interface, e.g. comparing against methods instead of properties where appropriate.

The public API is well-documented, and each method is covered by its own test suite.  Each includes tests to verify immutability of existing collections.


Overview
---------

URICollections have methods matching most of the Underscore Collection and Array APIs.  Most of these methods proxy to the corresponding Underscore functions at some point, with additional logic to ensure immutability, produce sensible return types, and convert list/collection convenience functions into forms that are reasonable for URIjs' interface.

####Immutability
All collections are immutable, even when normally mutating methods are used while iterating over collection elements.  This is achieved by cloning the collection elements behind the scenes before they're passed to the iterating function.

```javascript
var URICollection = require("uri-collection");
var urls = [
	"http://www.justcats.net/fuzz",
	"http://www.reddit.com/r/alsocats",
	"http://www.foxnews.com/nospinzone"
];
var collection1 = new URICollection(urls);
var collection2 = collection1.map( function(oneUrl) {
	oneUrl.domain("google.com");
});

console.log( collection2.toString() );
// [ "http://www.google.com/fuzz",
//	"http://www.google.com/r/alsocats",
//	"http://www.google.com/nospinzone" ]

// the first collection's elements aren't modified,
// even though the operation was performed on object 
// references.
console.log( collection1.toString() );
// 	[ "http://www.justcats.net/fuzz",
//	"http://www.reddit.com/r/alsocats",
//	"http://www.foxnews.com/nospinzone" ]
```

####Sensible Return Types

When the corresponding Underscore function always returns a single list element, a URICollection method will return a cloned URIjs instance.

In cases where the Underscore method returns an array, the return type depends on the type of the first array element.  If the first element is a URIjs instance, the array is wrapped in a new URICollection before being returned.  If it's any other type, the raw array is returned.  This is in line with the results reasonably expected from the operations in question, e.g. :

```javascript
var URICollection = require("uri-collection");
var assert = require("assert");
var urls = [
	"http://www.thundercats.org/nostalgia",
	"http://www.garmentdistrict.com/district/not.html",
	"http://www.reddit.com/r/probablymorecats"
];
var collection1 = new URICollection(urls);
var collection2 = collection1.map( function(oneUrl) {
	oneUrl.tld("net");
	// calling #tld("net") mutates a URI instance,
	// changing its TLD to ".net"
});
var domainArray = collection1.map( function(oneUrl) {
	oneUrl.domain();
	// calling #domain() without parameters returns
	// the URI's domain as a string
});

assert(collection2 instanceof URICollection); // true
assert(domainArray instanceof Array); // true

```
Above, calling `URI#domain()` on each element returns a plain array because the #domain() method returns a string.  Calling `URI#tld("net")` on each element returns a new URICollection because the method returns a mutated URIjs instance.

The `#first(n)` and `#last(n)` methods follow the convention of Underscore's matching functions: where `n` is 1 or `null`, a single element (URIjs instance) is returned, and where `n >= 2`, a new URICollection is returned.

####Adaptations for URIjs' Interface

Many Underscore convenience methods are intended for plain Javascript objects or arrays - e.g. the object methods `#where()` and `#pluck()` are suited to handling properties from normal objects, but not to more complicated objects with data accessed via prototype methods.

URIjs instances have methods where the names might suggest properties.  E.g. instead of a property, `uri.domain` is a getter/setter method which gets when called with no arguments and sets when called with a string.  The adapted methods on URICollection instances take this into account, so methods like `#pluck(propertyName)` work the same way:

```
var URICollection = require("uri-collection");
var urls = [
	"http://www.PepsiLovesYourDemographic.com",
	"http://www.burgerking.com/HealthyEatsAtThePalace",
	"http://www.frogenthusiasts.net"];
var collection = new URICollection(urls);
var domains = collection.pluck("domain");

console.log(domains);
// ["PepsiLovesYourDemographic.com", "burgerking.com", "frogenthusiasts.net"]
``` 

This is also true of the `#where()` and `#findWhere()` methods, each of which take an object of key-value pairs to match in the collection.  The adapted URICollection methods know to use the named keys as methods of their elements, so this works:
```
// same collection as above
var burgerLink = collection.findWhere({domain: "burgerking.com"});
console.log( burgerLink.toString() );
// "http://www.burgerking.com/HealthyEatsAtThePalace"
```

These and the other methods are fully documented on the API page.


Installation
------------

    npm install uri-collection


GitHub
------------
https://github.com/scivey/uri-collection


Contact
------------
https://github.com/scivey

http://www.scivey.net

scott.ivey@gmail.com

License
------------
MIT License (MIT)

Copyright (c) 2013 Scott Ivey, <scott.ivey@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
