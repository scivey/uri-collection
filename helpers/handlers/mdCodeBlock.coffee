path = require "path"
_ = require "underscore"
_.str = require "underscore.string"
fs = require "fs"


log = (msg) -> console.log msg

indir = do ->
	dPath = path.normalize __dirname
	(fPath) ->
		path.join dPath, fPath

hilite = require indir("hilite.coffee")

inspect = do ->
	util = require "util"
	opts =
		colors: true
		depth: null
	(objectRef) ->
		console.log util.inspect(objectRef, opts)

handler = (block, callback) ->
	hilite block.text, block.lang, (err, result) ->
		block.text = result
		callback null, block

module.exports = handler