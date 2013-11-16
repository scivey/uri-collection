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

	subUrls = []
	reduceCollection = {}


	protocolCombiner = (soFar, elem) ->
		soFar += "#{elem.protocol()}"
		soFar

	domainCombiner = (soFar, elem) ->
		soFar += "#{elem.domain()}"
		soFar


	beforeEach ->
		subUrls = [
				"http://www.burgerking.com/"
				"http://www.sploink.net/"
				"http://www.cowsjustcows.org/"
				"http://www.sploink.net/different.html"
				"http://www.genericrecipes.net"
		]
		reduceCollection = new URICollection(subUrls)

	describe "reduce", ->



		it "should not wrap its output in a URICollection.", ->

			catProtocols = reduceCollection.reduce protocolCombiner, ""

			assert( catProtocols not instanceof URICollection )

		it "should return the same result as iteration over a plain array of the same URIs.", ->

			collResult = reduceCollection.reduce protocolCombiner, ""

			arrayResult = _.reduce reduceCollection.toArray(), protocolCombiner, ""

			assert( collResult is arrayResult )

		it "should return correct results.", ->

			collResult = reduceCollection.reduce protocolCombiner, ""

			_correct = []
			for i in [0..reduceCollection.size() - 1]
				_correct.push "http"

			_correct = _correct.join("")

			assert( collResult is _correct )

	describe "reduceRight", ->


		it "should not wrap its output in a URICollection.", ->

			catProtocols = reduceCollection.reduceRight protocolCombiner, ""

			assert( catProtocols not instanceof URICollection )

		it "should return the same result as iteration over a plain array of the same URIs.", ->

			collResult = reduceCollection.reduceRight protocolCombiner, ""

			arrayResult = _.reduceRight reduceCollection.toArray(), protocolCombiner, ""

			assert( collResult is arrayResult )

		it "should return correct results.", ->

			collResult = reduceCollection.reduceRight domainCombiner, ""

			_correct = []
			_correct = _.chain( reduceCollection.toArray() )
							.map( (el) -> el.domain() )
							.reverse()
							.value()
							.join("")

			assert( collResult is _correct )

		it "should return different results than `reduce` when operation is non-associative", ->

			rightReduced = reduceCollection.reduceRight domainCombiner, ""
			leftReduced = reduceCollection.reduce domainCombiner, ""

			assert( rightReduced isnt leftReduced )


