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

fs.readFile indir("../mdsrc/intro.md"), "utf8", (err, res) ->
	marked res, (err, html) ->
		windowTitle = "uri-collection"
		title = false
		if title
			windowtitle = title + " | " + windowTitle
		stache.render "straight", {linkName: "Home", projectTitle: "uri-collection", pageContents: html, windowTitle: windowTitle, title: title}, (err, rendered) ->
			fs.writeFile indir("../index.html"), rendered, (err) ->
				console.log "done"

fs.readFile indir("../mdsrc/overview.md"), "utf8", (err, res) ->
	marked res, (err, html) ->
		#console.log html
		title = "Overview"
		windowTitle = "uri-collection"
		if title?
			windowtitle = title + " | " + windowTitle
		stache.render "straight", {linkName: "Overview", projectTitle: "uri-collection", pageContents: html, windowTitle: windowTitle, title: title}, (err, rendered) ->
			#console.log rendered
			fs.writeFile indir("../overview.html"), rendered, (err) ->
				console.log "done"

