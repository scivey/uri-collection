marked = require "marked"
path = require "path"


indir = do ->
	_dir = path.normalize __dirname
	(fPath) -> path.join _dir, fPath

mdown = do ->
	hilite = require indir("hilite.coffee")

	options =
		gfm: true
		highlight: hilite
		tables: true,
		breaks: false,
		pedantic: false,
		sanitize: false,
		smartLists: true,
		smartypants: false,
		langPrefix: 'lang-'

	marked.setOptions options

	outs = (mdownString, cb) ->
		marked mdownString, (err, res) ->
			cb null, res


module.exports = mdown