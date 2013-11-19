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

loadHandle = do ->
	(fName, cb) ->
		fs.readFile fName, "utf8", (err, res) ->
			return cb(err) if err?
			tmpl = Handlebars.compile(res)
			#_cached[fName] = tmpl
			cb null, tmpl

Handlebars.registerHelper "commaList", (list) ->
	_out = _.clone(list)
	return new Handlebars.SafeString(_out.join(", "))

Handlebars.registerHelper "paramList", (list) ->
	_out = _.pluck list, "name"
	return new Handlebars.SafeString(_out.join(", "))

Handlebars.registerHelper "activateLinks", (linkList, context) ->


layoutToPath = (layoutName) ->
	indir("tmpl/layouts/#{layoutName}.handlebars")

defaultLayout = "default"

headLinks = do ->
	_links = [
		["Home", "index.html"]
		["Overview", "overview.html",]
		["API", "api.html"]
		["Specs", "spec.html"]
	]

	_keys = ["name", "href"]

	_outs = ->
		_.chain(_links)
				.map( (el) -> _.zip(_keys, el) )
				.map( (el) -> _.object(el) )
				.value()

	_outs



render = (templateName, options, cb) ->
	_templatePath = indir path.join("tmpl/", "#{templateName}.handlebars") 
	console.log _templatePath
	unless options.layout?
		options.layout = defaultLayout
	options.title ?= null

	links = headLinks()
	linkName = options.linkName
	_.each links, (aLink) ->
		if aLink.name is linkName
			aLink.class = "active-head-link"

	loadHandle layoutToPath(options.layout), (err, lay) ->
		loadHandle _templatePath, (err, tmpl) ->
			windowTitle = options.projectTitle
			if options.title
				windowTitle = options.title + " | " + windowTitle
			else
				windowTitle = windowTitle + " | " + "scivey"
			contents = tmpl(options)
			html = lay({contents: contents, title: options.title, windowTitle: windowTitle, projectTitle: options.projectTitle, headLinks: links})
			cb null, html


module.exports =
	render: render