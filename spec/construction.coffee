assert = require "better-assert"

_ = require "underscore"

{URICollection, isURI} = require "../index.js"
URI = require "URIjs"

urlList = [
	"http://www.google.com/foo"
	"http://www.cnn.com/theNewsIGuess"
	"http://www.foo.com/index.html"
]

describe "URICollection", ->
	describe "construction", ->
		it "should accept a single URL string.", ->
			_url = urlList[0]

			collection = new URICollection(_url)

			assert( collection.size() is 1 )
			assert( collection.at(0).toString() is _url)

		it "should accept multiple URL strings.", ->
			_url1 = urlList[0]
			_url2 = urlList[1]
			_url3 = urlList[2]

			collection = new URICollection(_url1, _url2, _url3)

			assert( collection.size() is 3 )
			assert( collection.at(0).toString() is _url1)
			assert( collection.at(1).toString() is _url2)
			assert( collection.at(2).toString() is _url3)

		it "should accept an array of multiple URL strings.", ->
			_urls = urlList.slice(0,3)

			collection = new URICollection(_urls)

			assert( collection.size() is _urls.length)
			for i in [0..(_urls.length - 1)]
				assert( collection.at(i).toString() is _urls[i])

		it "should accept an array with a single URL string.", ->
			_url = urlList[0]
			_url = [_url]

			collection = new URICollection(_url)

			assert( collection.size() is 1)
			assert( collection.at(0).toString() is _url[0])


		it "should accept a single URIjs instance.", ->
			_url = new URI(urlList[0])

			collection = new URICollection(_url)

			assert( collection.size() is 1 )
			assert( collection.at(0).toString() is _url.toString())

		it "should accept multiple URIjs instances.", ->

			_url1 = new URI(urlList[0])
			_url2 = new URI(urlList[1])
			_url3 = new URI(urlList[2])


			collection = new URICollection(_url1, _url2, _url3)

			assert( collection.size() is 3 )
			assert( collection.at(0).toString() is _url1.toString())
			assert( collection.at(1).toString() is _url2.toString())
			assert( collection.at(2).toString() is _url3.toString())


		it "should accept an array of multiple URIjs instances.", ->
			_urls = _.map urlList.slice(0,3), (aUrl) ->
				new URI(aUrl)

			collection = new URICollection(_urls)

			assert( collection.size() is _urls.length)
			for i in [0..(_urls.length - 1)]
				assert( collection.at(i).toString() is _urls[i].toString())

		it "should accept an array with a single URIjs instance.", ->
			_url = new URI(urlList[0])
			_url = [_url]

			collection = new URICollection(_url)

			assert( collection.size() is 1)
			assert( collection.at(0).toString() is _url[0].toString())
