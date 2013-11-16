assert = require "better-assert"

_ = require "underscore"

{URICollection, isURI} = require "../index.js"
URI = require "URIjs"

urlList = [
	"http://www.google.com/foo"
	"http://www.cnn.com/theNewsIGuess"
	"http://www.bing.com/yeahWeNamedItBing/"
	"http://www.foo.com/index.html"
	"http://www.bar.net/scrubadub"
	"http://www.powwow.net"
	"http://www.genericrecipes.net"
	"http://www.whatevs.co.uk"
	"http://www.justcats.com"
]

URLCOUNT = urlList.length
URL_INDICES = [0..URLCOUNT-1]

add = (x, y) -> x + y


describe "URICollection", ->

	_urls = _.clone(urlList)
	collection = {}

	beforeEach ->
		_urls = _.clone(urlList)
		collection = new URICollection(_urls)

	describe "at", ->

		it "should return a URIjs instance", ->

			assert( collection.at(3) instanceof URI )

		it "should return a URIjs instance with a `.toString()` value equal to the string value at index `i` of the collection's `.toArray()` output.", ->

			stringArray = collection.toString()
			for i in [0..5]
				assert( collection.at(i).toString() is stringArray[i] )

		it "should return null if there is no URL instance at that index.", ->

			badIndex = collection.size() + 1
			assert( collection.at(badIndex) is null )

		it "should return the (N - 1)th from the last element if a negative index is passed.", ->

			size = collection.size()
			for i in [0..size - 1]
				fromStart = i
				fromEnd = (size - i) * -1
				assert( collection.at(fromStart).toString() is collection.at(fromEnd).toString())

	describe "first", ->

		it "if N==null or N==1, should return a URIjs instance", ->

			assert( collection.first() instanceof URI )
			assert( collection.first(1) instanceof URI )

		it "if N>1, should return a URICollection instance.", ->

			assert( collection.first(2) instanceof URICollection)
			assert( collection.first(4) instanceof URICollection)
	
		it "if N>1, should return a collection with N elements.", ->

			nVals = [2, 5, 3]
			for n in nVals
				assert( collection.first(n).size() is n)

		it "should return the first N elements", ->

			nVals = [2, 5, 3]
			for n in nVals
				firsted = collection.first(n)
				assert (firsted.size() is n)
				for i in [0..n-1]
					_index = i
					assert( firsted.at(i).toString() is collection.at(_index).toString() )

			assert( collection.first().toString() is collection.at(0).toString() )

	describe "last", ->

		it "if N==null or N==1, should return a URIjs instance", ->

			assert( collection.last() instanceof URI )
			assert( collection.last(1) instanceof URI )

		it "if N>1, should return a URICollection instance.", ->

			assert( collection.last(2) instanceof URICollection)
			assert( collection.last(4) instanceof URICollection)
	
		it "if N>1, should return a collection with N elements.", ->

			nVals = [2, 5, 3]
			for n in nVals
				assert( collection.last(n).size() is n)

		it "should return the last N elements", ->

			nVals = [2, 4]
			size = collection.size()
			for n in nVals
				lasted = collection.last(n)
				assert( lasted.size() is n)
				for i in [0..n-1]
					_index = ((size - n) + i )
					assert( lasted.at(i).toString() is collection.at(_index).toString())

			assert( collection.last().toString() is collection.at(size - 1).toString() )

	describe "rest", ->

		it "should return a URICollection instance for any N, including null", ->

			assert( collection.rest() instanceof URICollection )
			assert( collection.rest(3) instanceof URICollection )

		it "if n is null, should return a number of elements equal to `size() - 1`", ->
			size = collection.size()
			assert( collection.rest().size() is (size - 1) )

		it "if n is NOT null, should return a number of elements equal to `size() - n`", ->

			nVals = [2, 5, 3]
			size = collection.size()
			for n in nVals
				assert( collection.rest(n).size() is (size - n))

		it "should return the elements from index N to the end.", ->

			nVals = [2, 3]
			size = collection.size()
			for n in nVals
				rested = collection.rest(n)
				for i in [0..n-1]
					_index = i + n
					assert( rested.at(i).toString() is collection.at(_index).toString() )

	describe "initial", ->

		it "should return a URICollection instance for any N, including null.", ->

			assert( collection.initial() instanceof URICollection )
			assert( collection.initial(3) instanceof URICollection )

		it "if n is null, should return a number of elements equal to `size() - 1`", ->
			size = collection.size()
			assert( collection.initial().size() is (size - 1) )

		it "if n is NOT null, should return a number of elements equal to `size() - n`", ->

			nVals = [2, 5, 3]
			size = collection.size()
			for n in nVals
				assert( collection.initial(n).size() is (size - n))

		it "should return the elements from index 0 to (size - (n+1)).", ->

			nVals = [1, 3, 4]
			size = collection.size()
			for n in nVals
				initialed = collection.initial(n)
				for i in [0..n-1]
					_index = i
					assert( initialed.at(i).toString() is collection.at(_index).toString() )

