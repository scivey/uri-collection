_ = require "underscore"
fs = require "fs"
Handlebars = require "handlebars"
path = require "path"

indir = do ->
	_dpath = path.normalize __dirname
	(fName) -> path.join _dpath, fName

readJSON = (fName, cb) ->
	fs.readFile fName, "utf8", (err, res) ->
		return cb(err) if err?
		cb null, JSON.parse(res)

writeJSON = (fName, obj, cb) ->
	fs.writeFile fName, JSON.stringify(obj), (err) ->
		return cb(err) if err?
		cb null

marked = require indir("handlers/mdown.coffee")
stache = require indir("superstache.coffee")

fs.readFile indir("../README.md"), "utf8", (err, res) ->
	marked res, (err, html) ->
		stache.render "straight", {pageContents: html, title: "Overview"}, (err, rendered) ->
			fs.writeFile indir("../index.html"), rendered, (err) ->
				console.log "done"
