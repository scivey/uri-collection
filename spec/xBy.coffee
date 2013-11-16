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

add = (x, y) -> x + y


describe "URICollection", ->

	_urls = _.clone(urlList)
	collection = {}

	beforeEach ->
		collection = new URICollection(_urls)

	describe "countBy", ->

		counterFn = (aLink) ->
			aLink.domain() + " " + aLink.tld()

		it "should accept a property string and use the matching property as the counting criteria", ->

			counted = collection.countBy "domain"
			for i in URL_INDICES
				assert( _.has(counted, collection.at(i).domain() ) )

		it "should accept a function and use it to create the counting criteria", ->

			counted = collection.countBy(counterFn)

			for i in URL_INDICES
				#console.log i
				assert( _.has(counted, counterFn(collection.at(i))) ) 


		it "should return a total count equal to the number of instances in the collection", ->

			counted = collection.countBy "domain"
			stringSum = _.chain(counted)
					.values()
					.reduce( add, 0 )
					.value()

			assert ( stringSum is collection.size() )


			counted = collection.countBy(counterFn)
			funcSum = _.chain(counted)
					.values()
					.reduce( add, 0 )
					.value()

			assert ( funcSum is collection.size() )




	describe "groupBy", ->
		groupingFn = (aLink) ->
			aLink.domain() + " " + aLink.tld()

		it "should accept a property string and use the matching property as the grouping criteria", ->

			grouped = collection.groupBy "domain"
			for i in URL_INDICES
				assert( _.has(grouped, collection.at(i).domain() ) )

		it "should accept a function and use it to create the grouping criteria", ->

			grouped = collection.groupBy(groupingFn)

			for i in URL_INDICES
				#console.log i
				assert( _.has(grouped, groupingFn(collection.at(i))) )

		it "should have the same number of keys as the number of unique results for the grouping function over a plain array of the collection's elements.", ->

			list = collection.toArray()
			uniqueCount = _.chain(list)
							.map( groupingFn )
							.uniq()
							.value().length

			grouped = collection.groupBy(groupingFn)
			groupCount = _.keys(grouped).length

			assert( uniqueCount is groupCount )


		it "should have the same total number of URIs as the original collection", ->


			grouped = collection.groupBy "domain"

			stringCount = _.chain(grouped)
						.values()
						.map( (oneList) -> oneList.length)
						.reduce( add, 0 )
						.value()

			assert ( stringCount is collection.size() )

			grouped2 = collection.groupBy(groupingFn)
			funcCount = _.chain(grouped2)
						.values()
						.map( (oneList) -> oneList.length)
						.reduce( add, 0 )
						.value()

			assert ( funcCount is collection.size() )



	describe "sortBy", ->
		sortingFn = (aLink) ->
			aLink.toString().length

		it "should accept a property string and use the matching property as the sorting criteria", ->

			manualDomain = collection.map (el) -> el.domain()

			manualDomain = _.sortBy manualDomain, _.identity

			sorted = collection.sortBy "domain"
			for i in URL_INDICES
				assert( sorted.at(i).domain() is manualDomain[i] ) 

		it "should accept a function and use it to create the sorting criteria", ->

			sorted = collection.sortBy (aLink) -> aLink.toString().length

			manual = _.sortBy collection.toString(), (el) -> el.length


			for i in URL_INDICES
					assert (sorted.at(i).toString() is manual[i])

		it "should return an instance of URICollection", ->

			sorted = collection.sortBy "domain"
			assert( sorted instanceof URICollection )

		it "should return a collection with the same number of elements as the original.", ->

			sorted = collection.sortBy "domain"
			assert( sorted.size() is collection.size() )


	describe "shuffle", ->
		
		it "should return an instance of URICollection", ->

			shuffled = collection.shuffle()
			assert( shuffled instanceof URICollection )
			

		it "should return a collection with the same number of elements as the original", ->

			shuffled = collection.shuffle()
			assert( shuffled.size() is collection.size() )

		it "should return a collection with elements in a different order", ->

			orig = collection.toString()
			shuffled = collection.shuffle().toString()

			pairs = _.zip(orig, shuffled)

			result = _.some pairs, (aPair) -> aPair[0] isnt aPair[1]

			assert( result is true)
