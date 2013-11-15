assert = require "better-assert"

_ = require "underscore"

{URICollection, isURI} = require "../index.js"
URI = require "URIjs"

urlList = [
	"http://www.google.com/foo"
	"http://www.cnn.com/theNewsIGuess"
	"http://www.foo.com/index.html"
]

URLCOUNT = urlList.length
URL_INDICES = [0..URLCOUNT-1]

describe "URICollection", ->

	_urls = _.clone(urlList)
	collection = {}

	beforeEach ->
		collection = new URICollection(_urls)

	describe "map", ->

		it "should return a new URICollection when a map operation returns URIjs instances.", ->

			_mapped = collection.map (uri) -> 
				uri.domain("jabber.net")

			assert( _mapped instanceof URICollection)



		it "should return a vanilla array when a map operation returns results other than URIjs instances.", ->

			_mapped = collection.map (uri) ->
				uri.domain()

			assert( _mapped instanceof Array )


		it "should not mutate URIjs instances in the original collection", ->

			copy = collection.clone()
			_mapped = copy.map (uri) ->
				uri.domain("changed.net")

			for i in URL_INDICES
				assert ( copy.stringAt(i) is collection.stringAt(i) )
				assert ( _mapped.stringAt(0) isnt collection.stringAt(0))


		it "should produce the same result as a series of individual URIjs instance manipulations.", ->

			copy = collection.clone()
			_mapped = copy.map (uri) ->
				uri.domain("changed.net")

			for i in URL_INDICES
				assert ( _mapped.stringAt(i) is collection.at(i).clone().domain("changed.net").toString() )

	describe "toArray", ->
		it "should return a vanilla javascript array", ->

			assert( collection.toArray() instanceof Array )

		it "should return *clones* of its internal URIjs instances", ->

			fromCollection = collection.toArray()

			for i in URL_INDICES
				assert( fromCollection[i] isnt collection.at(i))

				assert( fromCollection[i].toString() is collection.at(i).toString() )

				assert( fromCollection[i].domain("other.org").toString() isnt collection.at(i).toString() )



	describe "clone", ->
		it "should return a new URICollection instance", ->

			assert ( collection.clone() instanceof URICollection )

		it "should create a copy with the same number of elements", ->

			assert ( collection.clone().size() is collection.size() )

		it "should create a copy with individual URIjs elements cloned themselves", ->

			cloned = collection.clone()

			for i in URL_INDICES
				assert( cloned.at(i) isnt collection.at(i) )


		it "should create a copy with DEEP-equal elements", ->

			cloned = collection.clone()

			for i in URL_INDICES
				assert( cloned.at(i).toString() is collection.at(i).toString() )

	describe "each", ->

		it "should return a new URI collection, even without an iterator return value", ->

			eachified = collection.each (x) -> x

			assert( eachified instanceof URICollection )
			assert( eachified.size() is collection.size() )

		it "should not mutate URIjs instances in the original collection", ->

			copy = collection.clone()
			eachified = copy.each (uri) ->
				uri.domain("changed.net")

			for i in URL_INDICES
				assert ( copy.stringAt(i) is collection.stringAt(i) )
				assert ( eachified.stringAt(0) isnt collection.stringAt(0))


		it "should produce the same result as a series of individual URIjs instance manipulations.", ->

			copy = collection.clone()
			eachified = copy.each (uri) ->
				uri.domain("changed.net")

			for i in URL_INDICES
				assert ( eachified.stringAt(i) is collection.at(i).clone().domain("changed.net").toString() )
