URI = require "URIjs"
_ = require "underscore"


log = (msg) -> console.log msg



compileWhereObjectIntoPredicate = (whereObj) ->
	_tests = _.pairs whereObj
	_count = _tests.length - 1
	_predicate = (listElem) ->
		for i in [0.._count]
			elemVal = _.result(listElem, _tests[i][0])
			#console.log elemVal
			unless elemVal is _tests[i][1]
				return false
		return true



cloneUris = (uriList) ->
	if _.isArray(uriList)
		_cloned = _.map uriList, (oneUri) ->
			oneUri.clone()
	else
		_cloned = uriList.clone(0)

	_cloned




# Tests a given string or object reference and returns true if it's a `URIjs` instance.
isURI = (aUri) ->
	if _.isString(aUri)
		return false

	if aUri.constructor? and aUri.constructor.prototype?
		if _.isFunction(aUri.constructor.prototype.domain)
			return true

	return false

class URICollection
	constructor: (initialLinks...) ->
		@_uris = []
		@_strungOut = []
		if initialLinks?
			#console.log "si!"
			@add(initialLinks)


	_strungList: ->
		if @_strungOut.length isnt @_uris.length
			@_strungOut = _.map @_uris, (oneUri) -> 
				oneUri.toString()
		@_strungOut


	###*
	 * Add URIs to the collection.
	 *
	 * @param {String,Object,Array} linkList A single link, multiple links, or an array of links.  A given link can be an existing URIjs instance or a string, which will be converted into a URIjs instance.
	 * @return {URICollection} A reference to the same URICollection (i.e. chained).
	###		

	add: (linkList...) ->
		linkList = _.flatten linkList
		_uris = @_uris
		_.each linkList, (aLink) ->
			unless isURI(aLink)
				#console.log "no"
				#console.log aLink
				aLink = new URI(aLink)
			_uris.push aLink
		return this

	###*
	 * Alias for `#add()`
	 * @param {String,Object,Array} linkList A single link, multiple links, or an array of links.  A given link can be an existing URIjs instance or a string, which will be converted into a URIjs instance.
	 * @return {URICollection} A reference to the same URICollection (i.e. chained).
	###		
	push: (linkList...) ->
		@add _.flatten(linkList)
		return this


	###*
	 * Returns an array of URI strings created by calling `#toString()` on each URIjs instance in the collection.
	 * @return {Array} An array of URI strings.
	 * @api public
	###		

	toString: ->
		_strings = _.map @_uris, (oneLink) -> oneLink.toString()
		_strings




	###*
	 * Returns a plain array of cloned URIjs instances matching those in the collection. 
	 *
	 * @return {Array} An array of URIjs instances.
	 * @api public
	###		

	toArray: ->
		_uris = cloneUris(@_uris)
		_uris


	###*
	 * Returns a clone of the URIjs instance at index `i`. 
	 *
	 * @param {Number} i The index of the instance to clone.
	 * @return {URI} A clone of the corresponding URIjs instance from the collection.
	 * @api public
	###		

	at: (index) ->
		if index < 0
			index = @size() + index

		if @_uris[index]?
			return @_uris[index].clone()
		else
			return null


	###*
	 * Returns the `#toString()` result of the URIjs instance at index `i`. 
	 *
	 * @param {Number} i The index of the instance to call `#toString()` on.
	 * @return {String} The string returned from calling `#toString()` on the instance.
	 * @api public
	###	
	stringAt: (index) ->
		@_uris[index].toString()


###*
 * Returns a new URICollection instance containing clones of the same URIs.
 *
 * @return {URICollection} A new URICollection.
 * @api public
###	

URICollection.prototype.clone = ->
	_uris = cloneUris(@_uris)
	return new URICollection(_uris)


makeCollectionReturningMethod = (methodName) ->
	(params...) ->
		_uris = cloneUris(@_uris)
		params.unshift _uris
		_result = _[methodName].apply(null, params)
		return new URICollection(_result)

###*
 * Just like the Underscore `_.filter` method, but returns a new URICollection with cloned URI instances.
 * 
 * Accepts a predicate function `predicateFn` and applies it to each element in sequence, returning a collection containing all elements that cause the predicate to return true.
 * 
 * @param {Function} predicateFn A function which will be handed each collection element and should return `true` for all elements to be included in the new collection.
 * @return {URICollection} A new URICollection instance containing the matching elements, regardless of the number of matches.
###	
URICollection.prototype.filter = makeCollectionReturningMethod("filter")

###*
 * Just like the Underscore `_.reject` method (the inverse of `_.filter`), but returns a new URICollection with cloned URI instances.
 * 
 * Accepts a predicate function `predicateFn` and applies it to each element in sequence, returning a collection containing all elements that cause the predicate to return false.
 * 
 * @param {Function} predicateFn A function which will be handed each collection element and should return `false` for all elements to be included in the new collection.
 * @return {URICollection} A new URICollection instance containing the matching elements, regardless of the number of matches.
###	
URICollection.prototype.reject = makeCollectionReturningMethod("reject")

###*
 * Just like the Underscore `_.shuffle` method, but returns a new URICollection with cloned URI instances.
 * 
 * The new collection has its elements randomly shuffled.
 * 
 * @return {URICollection} A new URICollection instance containing clones of the shuffled elements.
###	
URICollection.prototype.shuffle = makeCollectionReturningMethod("shuffle")



makeNonCollectionReturningMethod = (methodName) ->
	(params...) ->
		_uris = cloneUris(@_uris)
		params.unshift _uris
		return _[methodName].apply(null, params)

###*
 * Returns the number of URI elements in the collection.
 * 
 * @return {Number} The size of the collection.
###	
URICollection.prototype.size = ->
	@_uris.length

###*
 * Returns true if any element passes a truth test passed in as a callback.
 * 
 * Uses Underscore's `_.some`, but guarantees immutability.
 *
 * @param {Function} truthTest A function which is handed collection elements in sequence and should return true or false depending on the element's attributes.
 * 
 * @return {Boolean} True if any element passes the test; false if none of them do.
###	
URICollection.prototype.some = makeNonCollectionReturningMethod("some")

###*
 * Returns true if every element passes a truth test passed in as a callback.
 * 
 * Uses Underscore's `_.every`, but guarantees immutability.
 *
 * @param {Function} truthTest A function which is handed collection elements in sequence and should return true or false depending on the element's attributes.
 * 
 * @return {Boolean} True if every element passes the test; false if any element fails.
###	
URICollection.prototype.every = makeNonCollectionReturningMethod("every")


###*
 * Typical reduce operation, creating a single result by iterating over a list of elements from left to right.
 *
 * Proxies to Underscore's `_.reduce` with an added safety for immutability.
 *
 * @param {Function} iterator A function which takes `(soFar, elem)` as its arguments, where `soFar` is the value of the reduce operation up to that point and `elem` is the current collection element.  It receives collection elements in left to right order.
 * @param {Any} initial Initial value to pass as `current` to the first cycle of the iterator function.
 * @return {Any} Any value returned by the reduce operation.  There is no automatic wrapping in new URICollection instances.
###	
URICollection.prototype.reduce = makeNonCollectionReturningMethod("reduce")

###*
 * Typical reduce operation but reversed, creating a single result by iterating over a list of elements from right to left.
 *
 * Proxies to Underscore's `_.reduce` with an added safety for immutability.
 *
 * @param {Function} iterator A function which takes `(soFar, elem)` as its arguments, where `soFar` is the value of the reduce operation up to that point and `elem` is the current collection element.  It receives collection elements in right to left order.
 * @param {Any} initial Initial value to pass as `current` to the first cycle of the iterator function.
 * @return {Any} Any value returned by the reduce operation.  There is no automatic wrapping in new URICollection instances.
###	
URICollection.prototype.reduceRight = makeNonCollectionReturningMethod("reduceRight")

###*
 * Returns the first `n` list elements.
 * 
 * @param {Number} n The number of elements to return, defaulting to 1.
 * @return {URICollection,URI} If `n > 1`, returns a `URICollection`.  If `n===1` or `typeof n === 'null'`, returns a cloned URIjs instance.
###	

URICollection.prototype.first = (n) ->
	if n? and n isnt 1
		_origUris = _.first(@_uris, n)
		return new URICollection( cloneUris(_origUris) )
	else
		return @at(0).clone()


###*
 * Returns the last `n` list elements.
 * 
 * @param {Number} n The number of elements to return, defaulting to 1.
 * @return {URICollection,URI} If `n > 1`, returns a `URICollection`.  If `n===1` or `typeof n === 'null'`, returns a cloned URIjs instance.
###	
URICollection.prototype.last = (n) ->
	if n? and n isnt 1
		_origUris = _.last(@_uris, n)
		return new URICollection( cloneUris(_origUris) )
	else
		return @at(@size() - 1).clone()


###*
 * Returns a new URICollection with copies of the elements from index `n` to the end.
 * 
 * @param {Number} n The index to start copying from, defaulting to 1.
 * @return {URICollection} A URICollection instance, even if only one element is returned.  This is in line with Underscore's behavior.
###
URICollection.prototype.rest = (n) ->
	n ?= 1
	_origUris = _.rest(@_uris, n)
	return new URICollection( cloneUris(_origUris) )

###*
 * Returns a new URICollection with copies of the elements from from index 0 up to index `#length() - n`.
 * 
 * @param {Number} n The number of ending elements to omit, defaulting to 1.
 * @return {URICollection} A URICollection instance, even if only one element is returned.  This is in line with Underscore's behavior.
###
URICollection.prototype.initial = (n) ->
	n ?= 1
	_origUris = _.initial(@_uris, n)
	return new URICollection( cloneUris(_origUris) )



###*
 * Predicate function indicating whether the collection contains the passed URI, given as a string, `URIjs` instance, or `RegExp`.
 * 
 * The comparison is against the array of `#toString()` results of the collection's elements.
 * 
 * If a URIjs instance is passed in as `val`, its own `#toString()` is used for comparison.
 * 
 * If a RegExp instance is passed in as `val`, the result is determined by calling its `#.test()` method with each collection element's `#toString()`, short-circuiting when any returns true.
 * 
 * @param {String,Object,RegExp} val The value to search for.
 * @return {Boolean} `true` if the collection contains the value; `false` otherwise.
###
URICollection.prototype.contains = (val) ->
	_stringUris = @_strungList()

	if _.isString(val)
		return _.contains(_stringUris, val)
	else if (val instanceof URI)
		return _.contains(_stringUris, val.toString())
	else if _.isRegExp(val)
		return _.some(_stringUris, (aString) -> val.test(aString) )
	
	throw new Error("Unrecognized value passed for URICollection.contains: #{val}")


###*
 * Accepts a truth-testing function and returns the first element to cause a `true` return value.  Proxies to Underscore's `_.find`, but returns a cloned URIjs instance to ensure immutability of collection elements.
 * 
 * @param {Function} testFn The truth-testing function which will iterate over collection elements, short-circuiting at the first to return true.
 * @return {URI,null} If a result is found, a clone of the matching `URIjs` instance.  Otherwise, returns `null`.
###
URICollection.prototype.find = (testFn) ->
	_uris = cloneUris(@_uris)

	result = _.find _uris, testFn

	if result?
		return result

	return null


###*
 * Accepts an iterator function and applies it to a cloned list of collection elements, returning a new `URICollection` instance with the results.
 * 
 * This is distinct from `#map()` because this implementation of `#each()` _always_ returns a new URICollection, even if `iterFn` doesn't have any return value.  `#map()` only returns a new URICollection if it results in an array of `URIjs` instances. 
 *
 * No changes are made to the original collection elements.
 * 
 * @param {Function} iterFn The iterator function which will be called with each collection element in sequence.
 * @return {URICollection} A URICollection instance created by applying `iterFn` to each of a cloned array of internal `URIjs` instances. 
###

URICollection.prototype.each = (iterFn) ->
	_uris = cloneUris(@_uris)
	_results = _.map _uris, iterFn
	return new URICollection(_results)



###*
 * Accepts an iterator function and applies it to a cloned list of collection elements.  Depending on the iterator's output, this method will either return a new `URICollection` instance or a plain array.
 * 
 * If the `mapFn` returns an array of `URIjs` instances, they will be wrapped in a new `URICollection` and returned.  If it returns another type of result, the plain array will be returned to the client.
 * 
 * A given map operation's outputs are assumed to be homogeneous with respect to type, so the type of the internal array resulting from proxying to `_.map(list, mapFn)` is determined by testing only the first element. 
 * 
 * No changes are made to the original collection elements.
 * 
 * @param {Function} mapFn The iterator function which will be called with each collection element in sequence.
 * @return {Array,URICollection} Either a new `URICollection` (if an array of `URIjs` instances are returned) or a plain array of results (e.g. if strings of element hostnames are returned.) 
###
URICollection.prototype.map = (params...) ->

	_uris = cloneUris(@_uris)
	params.unshift _uris
	_results = _.map.apply(null, params)
	if isURI(_results[0])
		# test first element of result list.
		# we assume that the iterator function produced
		# a homogeneous list of results - so if the first
		# elem is a URI instance, the rest are too.
		return new URICollection(_results)
	else
		# if the iterator fn didn't create an array of URI
		# instances, return a vanilla array of results instead
		# of trying to instantiate a URICollection.
		return _results


###*
 * Accepts a method name and optional additional arguments to pass to that method, and invokes the given method on each URIjs instance in the collection.
 * 
 * Because `URIjs` methods without argument return attribute information - e.g. `uri.domain()` returns the string-format URI domain - a plain array of results is returned if no additional arguments are supplied.
 * 
 * Calling `URIjs` methods with arguments generally causes mutation and returns the object - e.g. `uri.domain("justcats.net")` returns the same object with its domain changed to `justcats.net`.  For this reason, passing additional arguments causes the result to be wrapped in a new URICollection instance.
 *
 * No changes are made to the original collection elements.
 
 * @param {String} methodName A string representing the method name to invoke on each collection element.
 * @param {Array} args (Optional) Additional arguments to pass when invoking `methodName`.
 * @return {Array,URICollection} If no additional arguments are passed, a plain array of results.  Otherwise, a new URICollection wrapping clones of the URIjs elements from the original collection. 
###
URICollection.prototype.invoke = (params...) ->
	if params.length is 1
		# no arguments passed in = no mutation on URI objects,
		# so no need to clone them.
		_method = params[0]
		_results = _.map @_uris, (oneUri) -> oneUri[_method]()
		return _results
	else
		_uris = cloneUris(@_uris)
		params.unshift _uris
		_results = _.invoke.apply(null, params)
		return new URICollection(_results)


###*
 * Accepts a property name or a function and uses it to create a plain Javascript object with the collection's elements keyed by the results of the grouping function or property.
 *
 * @param {String,Function} groupingMethod A string representing a method to invoke on each element, grouping by the output, or a function which is passed each element in sequence and calculates the correct group key.
 * @param {Boolean} asStrings (Optional) If `true` is passed, the value for each group key on the returned object will be an array of URI strings instead of URICollections.
 * @return {Object} An object with keys determined by the grouping criteria, with URICollections as the values.  If `asStrings=true`, the values are converted to arrays of URI strings. 
###
URICollection.prototype.groupBy = (propOrFunc, asStrings) ->

	_uris = cloneUris(@_uris)
	if _.isString(propOrFunc)
		groupFn = (listElem) ->
			_.result(listElem, propOrFunc)
	else
		groupFn = propOrFunc

	_results = _.groupBy _uris, groupFn
	_finalResults = _results

	if asStrings is true
		_finalResults = _.chain(_results)
							.pairs()
							.map( (aPair) -> [aPair[0], _.map(aPair[1], (el) -> el.toString())] )
							.object()
							.value()
	else
		_finalResults = _.chain(_results)
							.pairs()
							.map( (aPair) -> [aPair[0], new URICollection(aPair[1])] )
							.object()
							.value()

	_finalResults


###*
 * Accepts a property name or a function and uses it to create a plain Javascript object keyed by the outputs of the counting function, with values equal to the number of times a given output was returned.
 *
 * @param {String,Function} countingMethod A string representing a method to invoke on each element, counting by the output, or a function which is passed each element in sequence and calculates the correct result to count by.
 * @return {Object} An object with keys determined by the counting criteria, with `Number` values corresponding to the number of times a given key was returned.
###

URICollection.prototype.countBy = (propOrFunc) ->
	if _.isString(propOrFunc)
		# if it's a string then we control the iterator fn,
		# so we know no mutation will happen.
		_uris = @_uris
		countFn = (listElem) ->
			_.result(listElem, propOrFunc)

	else
		# otherwise we clone for safety.
		_uris = cloneUris(@_uris)
		countFn = propOrFunc
	#console.log _uris.length
	_results = _.countBy(_uris, countFn)



###*
 * Accepts a method name or a function and uses it to create a new URICollection with elements ordered by the function output or method invocation output for each object.
 * @param {String,Function} sortingMethod A string representing a method to invoke on each element, returning a value used to sort by, or a function which is passed each element in sequence and calculates the correct value to sort by.
 * @return {URICollection} A new collection with elements sorted according to the returned sorting criteria.
###

URICollection.prototype.sortBy = (propOrFunc) ->
	_uris = cloneUris(@_uris)
	if _.isString(propOrFunc)
		sortFn = (listElem) ->
			_.result(listElem, propOrFunc)
	else
		sortFn = propOrFunc
	#console.log _uris.length
	_results = _.sortBy(_uris, sortFn)
	return new URICollection(_results)


###*
 * Accepts a property name and returns a plain array with the value of that property for each element in the collection.
 * Similar to Underscore's own `_.pluck` but internally uses _.resolve in a map operation, because URIjs properties are all returned by methods. 
 * @param {String} propertyName A string representing the property to pluck from each collection element.
 * @return {Array} A plain array of results.
###
URICollection.prototype.pluck = (attrib) ->
	# don't need to clone internal URI list,
	# since we aren't returning URI instances themselves.
	_uris = @_uris
	_results = _.map _uris, (oneUri) ->
		return _.result(oneUri, attrib)
	return _results

###*
 * Accepts a query object and returns all collection elements with properties matching the key-value pairs in that object.
 * @param {Object} queryObject A plain Javascript object containing properties to match, e.g. `{domain: 'google.com'}`
 * @return {URICollection} A new URICollection instance.
###
URICollection.prototype.where = (whereObject) ->
	_pred = compileWhereObjectIntoPredicate(whereObject)
	_results = _.chain( @_uris )
				.filter( _pred )
				.map( (aUri) -> aUri.clone() )
				.value()
	return new URICollection(_results)


###*
 * Accepts a query object and returns the first collection element with properties matching the key-value pairs in that object.  Like `#where()`, but only returns the first result and does not wrap it in a collection - it returns a `URIjs` instance.
 * @param {Object} queryObject A plain Javascript object containing properties to match, e.g. `{domain: 'google.com'}`
 * @return {URI} A clone of the first `URIjs` element in the collection matching the query.
###
URICollection.prototype.findWhere = (whereObject) ->
	_pred = compileWhereObjectIntoPredicate(whereObject)
	_result = _.find( @_uris, _pred )
	unless _result?
		return null
	_result.clone()


###*
 * Returns `n` randomly selected elements from the collection.  If `n==1` or `typeof n === "null"`, returns a `URIjs` instance.  If `n > 1`, returns a new `URICollection` instance.
 * @param {Number} n The number of elements to return in the sample, defaulting to 1.
 * @return {URICollection,URI} A URICollection instance if `n > 1`, or a `URIjs` instance otherwise.
###
URICollection.prototype.sample = (n) ->
	# if n is null or 1, we return a single URI instance.
	# otherwise, return an instance of URICollection containing
	# `n` URI instances.
	if n? and n isnt 1
		_uris = cloneUris(@_uris)
		params = [_uris, n]
		_results = _.sample.apply(null, params)
		return new URICollection(_results)
	else
		sample = _.sample(@_uris)
		return sample.clone()



module.exports =
	URICollection: URICollection
	isURI: isURI
