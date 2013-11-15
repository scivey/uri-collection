URI = require "URIjs"
_ = require "underscore"


log = (msg) -> console.log msg

compileWhereObjectIntoPredicate = (whereObj) ->
	_tests = _.pairs whereObj
	_count = _tests.length - 1
	_predicate = (listElem) ->
		for i in [0.._count]
			elemVal = _.result(listElem, _tests[i][0])
			console.log elemVal
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
		if initialLinks?
			#console.log "si!"
			@add(initialLinks)

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

	push: (linkList...) ->
		@add _.flatten(linkList)
		return this

	toString: ->
		_strings = _.map @_uris, (oneLink) -> oneLink.toString()
		_strings


	strung: ->
		_strings = @toString()
		return _strings.join("\n")

	toArray: ->
		_uris = cloneUris(@_uris)
		_uris

	at: (index) ->
		@_uris[index].clone()

	stringAt: (index) ->
		@_uris[index].toString()

URICollection.prototype.toArray = ->
	# clone internal list of URI objects,
	# and return the raw array
	_uris = cloneUris(@_uris)
	_uris


URICollection.prototype.clone = ->
	_uris = cloneUris(@_uris)
	return new URICollection(_uris)

_collectionReturningMethods = [
	"filter"
	"reject"
	"sortBy"
	"shuffle"
	"initial"
]

_.each _collectionReturningMethods, (aMethod) ->
	URICollection.prototype[aMethod] = (params...) ->
		_uris = cloneUris(@_uris)
		params.unshift _uris
		_result = _[aMethod].apply(null, params)
		return new URICollection(_result)

_nonCollectionReturningMethods = [
	"reduce"
	"reduceRight"
	"find"
	"some"
	"contains"
	"max"
	"min"
	"size"
	"first"
	"last"
	"rest"
]

_.each _nonCollectionReturningMethods, (aMethod) ->
	URICollection.prototype[aMethod] = (params...) ->
		_uris = cloneUris(@_uris)
		params.unshift _uris
		return _[aMethod].apply(null, params)

URICollection.prototype.each = (iterFn) ->
	# distinct from `map` because iterator doesn't necessarily
	# need to return a list of URI instances - e.g. could just
	# call uri.domain("google.com") and not return anything.
	# 
	# that would cause the map implementation in use to return
	# an (empty) vanilla array, not a URICollection.
	# 
	# This seems more in line with the likely expectation of
	# getting the same type of list back.
	_uris = cloneUris(@_uris)
	_results = _.map _uris, iterFn
	return new URICollection(_results)


URICollection.prototype.map = (params...) ->
	# returns a new URICollection _if_ the results are URI
	# instances, and a plain array otherwise.
	# In

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



URICollection.prototype.invoke = (params...) ->
	if params.length is 1
		# no arguments passed in = no mutation on URI objects,
		# so no need to clone them.
		_method = params[0]
		_results = _.map @_uris, (oneUri) -> oneUri[_method]()
		return results
	else
		_uris = cloneUris(@_uris)
		params.unshift _uris
		_results = _.invoke.apply(null, params)
		return new URICollection(_results)




URICollection.prototype.groupBy = (propOrFunc, asStrings) ->
	# `propOrFunc` is either a grouping function or a property to group by.
	# this requires special handling because all URI.[x] properties are really
	# functions.
	# 
	# We can't return a new URICollection instance here because the structure resulting
	# from `_.groupBy` isn't a normal list - it's a collection of sublists keyed by
	# group names.
	# 
	# By default, each group's value is an array of URI instances.
	# 
	# passing `true` for `asStrings` indicates that client wants group values in the
	# form of arrays of strings instead, i.e. the arrays resulting from calling `.toString()` on
	# each URI instance of each group list.
	# 
	_uris = cloneUris(@_uris)
	if _.isString(propOrFunc)
		groupFn = (listElem) ->
			_.result(listElem, propOrFunc)
	else
		groupFn = propOrfunc

	_results = _.groupBy _uris, groupFn
	_finalResults = _results

	if asStrings is true
		_finalResults = _.chain(_results)
							.pairs()
							.map( (aPair) -> [aPair[0], _.map(aPair[1], (el) -> el.toString())] )
							.object()
							.value()

	_finalResults

URICollection.prototype.countBy = (propOrFunc, asStrings) ->
	if _.isString(propOrFunc)
		# if it's a string then we control the iterator fn,
		# so we know no mutation will happen.
		_uris = @_uris
		countFn = (listElem) ->
			_.result(listElem, propOrFunc)

	else
		# otherwise we clone for safety.
		_uris = cloneUris(_uris)
		countFn = propOrFunc

	_results = _.countBy(_uris, countFn)



URICollection.prototype.pluck = (attrib) ->
	# don't need to clone internal URI list,
	# since we aren't returning URI instances themselves.
	_uris = @_uris
	_results = _.map _uris, (oneUri) ->
		return _.result(oneUri, attrib)
	return _results


URICollection.prototype.where = (whereObject) ->
	_pred = compileWhereObjectIntoPredicate(whereObject)
	_results = _.chain( @_uris )
				.filter( _pred )
				.map( (aUri) -> aUri.clone() )
				.value()
	return new URICollection(_results)

URICollection.prototype.findWhere = (whereObject) ->
	_pred = compileWhereObjectIntoPredicate(whereObject)
	_result = _.find( @_uris, _pred )
	_result.clone()

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


#URICollection.prototype.contains = (attrib, val) ->
	# takes either: 
	# 	- a query object like findWhere,
	# 	- a single string, indicating a straight text HREF,
	# 	- a key-val pair indicating a simple query-object-like thing.


###
links = [
	"http://www.cnn.com/somepage#para?q=aSearch"
	"http://www.google.com"
	"http://www.google.com/mail"
	"http://www.reddit.com/r/stuff"
]

uris = new URICollection()
uris.add(links)

notCnn = uris.filter (oneUri) ->
	#console.log oneUri.domain()
	oneUri.domain() isnt "cnn.com"

pandas = uris.map (aUri) -> 
	aUri.domain("pandakingdom.com")
###
###
console.log pandas.strung()

console.log uris.sample(2).pluck("domain")

console.log uris.map( (uri) -> uri.domain("microsoft.com").protocol("ftp") ).toString()
console.log uris.toString()

console.log uris.where( {domain: 'reddit.com'} ).toString()

console.log uris.groupBy("domain", true)

console.log uris.findWhere( {domain: 'google.com'}).toString()

console.log uris.countBy("domain")

console.log uris.size()
###

#console.log uris.toString()
#console.log uris.shuffle().toString()
#console.log uris.shuffle().toString()

#console.log uris.find( (el) -> el.domain() is "reddit.com").toString()
###
	filter: (pred) ->
		_match = []
		_.each @_uris, (oneUri) ->
			if pred(oneUri) then _match.push(oneUri)
		return new URICollection(_match)
###

module.exports =
	URICollection: URICollection
	isURI: isURI