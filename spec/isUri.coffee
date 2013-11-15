assert = require "better-assert"

{URICollection, isURI} = require "../index.js"
URI = require "URIjs"

describe "isURI", ->
	it "should return true for URI instances.", ->
		aLink = new URI("http://www.google.com")
		assert (isURI(aLink) is true)
	it "should not return true for strings.", ->
		aLink = "http://www.google.com"
		assert (isURI(aLink) is false)
	it "should not return true for other constructed objects.", ->

		Barly = ->
			this.fluxom = "zabberjabber"

		Barly.prototype.doSomething = ->
			return 17

		bar = new Barly()

		assert (isURI(bar) is false)
