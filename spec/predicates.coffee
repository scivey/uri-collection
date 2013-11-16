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
	"http://www.savethefuzzies.org"
	"http://justcats.tumblr.com"
]

URLCOUNT = urlList.length
URL_INDICES = [0..URLCOUNT-1]



describe "URICollection", ->

	_urls = _.clone(urlList)
	collection = {}

	beforeEach ->
		collection = new URICollection(_urls)


	describe "some", ->

		it "should return true if any collection elements pass the truth test", ->
			tlds = ["net", "com", "org"]

			_.each tlds, (oneTop) ->
				result = collection.some (el) -> el.tld() is oneTop
				assert( result is true )

		it "should return false if zero collection elements pass the truth test", ->
			tlds = ["moo", "zappa", "swoosh"]

			_.each tlds, (oneTop) ->
				result = collection.some (el) -> el.tld() is oneTop
				assert( result is false )

	describe "every", ->

		it "should return true if all collection elements pass the truth test", ->

			result = collection.every (el) -> el.protocol() is "http"
			assert( result is true )

		it "should return false if any collection elements fail the truth test", ->

			tlds = ["net", "com", "org"]
			_.each tlds, (oneTop) ->
				result = collection.every (el) -> el.tld() is oneTop
				assert( result is false )


	describe "contains", ->

		containsUrls = []
		containsColl = {}

		beforeEach ->
			containsUrls = [
				"http://www.google.com/foo"
				"http://www.cnn.com/theNewsIGuess"
				"http://www.foo.com/index.html"
				"http://www.powwow.net/"
			]
			containsColl = new URICollection(containsUrls)

		it "when passed a string, returns true if the string is equal to the `.toString()` result of any element.", ->

			result = containsColl.contains "http://www.powwow.net/"
			assert( result is true )

		it "when passed a string, returns false if the string is not equal to the `.toString()` result of any element.", ->

			result = containsColl.contains "http://www.jollyhumorousanecdotes.net/"
			assert( result is false )

		it "when passed a URLjs instance, returns true if the `.toString()` of that instance equals the `.toString()` of any element.", ->

			result = containsColl.contains( new URI("http://www.powwow.net") )
			assert( result is true )

		it "when passed a URLjs instance, returns false if the `.toString()` of that instance does not equal the `.toString()` of any element.", ->

			result = containsColl.contains( new URI("http://www.jollyhumorousanecdotes.net/") )
			assert( result is false )

		it "when passed a RegExp instance, returns true if calling that RegExp's `#test()` with any element's `.toString()` value returns true.", ->

			result = containsColl.contains(/^.*www.*$/i)
			assert( result is true )

		it "when passed a RegExp instance, returns false if calling that RegExp's `#test()` with every element's `.toString()` value returns false.", ->

			result = containsColl.contains(/^.*grognogblog.*$/i)
			assert( result is false )



