assert = require "better-assert"

_ = require "underscore"

{URICollection, isURI} = require "../index.js"
URI = require "URIjs"

urlList = [
	"http://www.google.com/foo"
	"http://www.cnn.com/theNewsIGuess"
	"http://www.foo.com/index.html"
	"http://www.powwow.net"
	"http://www.genericrecipes.net"
	"http://ihavefeelingsandiwriteaboutthem.wordpress.com"
	"http://justcats.tumblr.com"
]

URLCOUNT = urlList.length
URL_INDICES = [0..URLCOUNT-1]



describe "URICollection", ->

	_urls = _.clone(urlList)
	collection = {}

	beforeEach ->
		collection = new URICollection(_urls)

	describe "find", ->

		subUrls = []
		findCollection = {}


		beforeEach ->
			subUrls = [
					"http://www.burgerking.com/"
					"http://www.sploink.net/"
					"http://www.cowsjustcows.org/"
					"http://www.sploink.net/different.html"
			]
			findCollection = new URICollection(subUrls)



		it "should return a URIjs instance.", ->

			link = collection.find (elem) ->
				elem.domain() isnt ""

			assert( link instanceof URI )


		it "should return the first matching instance", ->

			subCollection = new URICollection(subUrls)

			_found = subCollection.find (link) ->
				link.domain() is "sploink.net"


			assert(_found.toString() is subUrls[1] )


		it "should return null if no match is found", ->

			_found = findCollection.find (link) ->
				link.domain() is "tickleMeElmo.net"
			assert( _found is null )


	describe "findWhere", ->


		subUrls = []
		fwCollection = {}

		beforeEach ->
			subUrls =  [
				"http://www.burgerking.com/"
				"http://www.sploink.net/"
				"http://www.cowsjustcows.org/"
				"http://www.sploink.net/different.html"
			]
			fwCollection = new URICollection(subUrls)

		it "should return a URIjs instance.", ->

			link = fwCollection.findWhere {domain: "burgerking.com"}
			assert( link instanceof URI )


		it "should convert a key-val query into a function invoking the correct instance method", ->

			_domain = "cowsjustcows.org"
			link = fwCollection.findWhere {domain: _domain}
			assert( link.domain() is _domain )
			assert( link.toString() is subUrls[2] )


		it "should return the first matching instance", ->

			_found = fwCollection.findWhere {domain: "sploink.net"}

			assert (_found.toString() is subUrls[1])

		it "should return null if no match is found", ->

			_found = fwCollection.findWhere { domain: "fakesite.net" }
			assert ( _found is null )


	describe "where", ->


		subUrls = []
		whereCollection = {}

		beforeEach ->
			subUrls =  [
				"http://www.burgerking.com/"
				"http://www.sploink.net/"
				"http://www.cowsjustcows.org/"
				"http://www.sploink.net/different.html"
				"http://www.hatsoftheworld.co.jp"
				"http://www.justsam.net"
				"http://www.sploink.net/home.html"
			]
			whereCollection = new URICollection(subUrls)

		it "should return a URICollection instance.", ->

			matching = whereCollection.where {domain: "burgerking.com"}
			assert( matching instanceof URICollection )


		it "should convert a key-val query into a function invoking the correct instance method", ->

			_domain = "cowsjustcows.org"
			matching = whereCollection.where {domain: _domain}
			assert( matching.size() is 1)
			assert( matching.at(0).toString() is subUrls[2] )


		it "should return _every_ matching URIjs instance.", ->

			_found = whereCollection.where {domain: "sploink.net"}

			assert (_found.size() is 3)

		it "should return _only_ matching URIjs instances.", ->

			found = whereCollection.where { domain: "sploink.net" }

			foundList = found.toArray()

			_.each foundList, (foundElem) ->
				assert(foundElem.domain() is "sploink.net")

		it "should return an empty URICollection instance if no matches are found.", ->

			found = whereCollection.where { domain: "nada.zabba"}

			assert( found instanceof URICollection )
			assert( found.size() is 0 ) 

	describe "sample", ->

		it "should return a URIjs instance when called with no parameters or with n == 1.", ->

			assert( collection.sample() instanceof URI )
			assert( collection.sample(1) instanceof URI )

		it "should return a URICollection instance when called with n > 1.", ->

			assert( collection.sample(2) instanceof URICollection )

		it "should return a URICollection with size == n when n > 1.", ->

			for n in [2..4]
				assert( collection.sample(n).size() is n )


	describe "filter", ->


		subUrls = []
		filtCollection = {}

		beforeEach ->
			subUrls =  [
				"http://www.burgerking.com/healthymealsatthepalace/"
				"http://www.sploink.net/"
				"http://www.cowsjustcows.org/"
				"http://www.pepsilovesyourdemographic.com"
				"http://www.buypostersorsomething.com"
				"http://www.sploink.net/different.html"
			]
			filtCollection = new URICollection(subUrls)

		it "should return a URICollection instance.", ->

			matching = filtCollection.filter (uri) -> uri.tld() is "com"
			assert( matching instanceof URICollection )


		it "should return all matches from the collection", ->

			matching = filtCollection.filter (uri) -> uri.tld() is "com"
			assert( matching.size() is 3 )

		it "should return the same result (count + deep-equal) as manual iteration over a plain array of the same URIs", ->

			filt = (elem) -> elem.tld() is "com"

			arrayResult = _.filter filtCollection.toArray(), filt

			collResult = filtCollection.filter filt

			assert( arrayResult.length is collResult.size() )

			for i in [0..arrayResult.length - 1]
				assert ( arrayResult[i].toString() is collResult.at(i).toString() )




	describe "reject", ->


		subUrls = []
		rejCollection = {}

		beforeEach ->
			subUrls =  [
				"http://www.burgerking.com/healthymealsatthepalace/"
				"http://www.sploink.net/"
				"http://www.cowsjustcows.org/"
				"http://www.pepsilovesyourdemographic.com"
				"http://www.buypostersorsomething.com"
				"http://www.sploink.net/different.html"
			]
			rejCollection = new URICollection(subUrls)

		it "should return a URICollection instance.", ->

			matching = rejCollection.reject (uri) -> uri.tld() is "com"
			assert( matching instanceof URICollection )


		it "should return all matches from the collection", ->

			matching = rejCollection.reject (uri) -> uri.tld() is "net"
			assert( matching.size() is 4 )

		it "should return the same result (count + deep-equal) as iteration over a plain array of the same URIs", ->

			rej = (elem) -> elem.tld() is "net"

			arrayResult = _.reject rejCollection.toArray(), rej

			collResult = rejCollection.reject rej

			assert( arrayResult.length is collResult.size() )

			for i in [0..arrayResult.length - 1]
				assert ( arrayResult[i].toString() is collResult.at(i).toString() )







