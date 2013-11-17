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
	_cached = {}
	(fName, cb) ->
		if _cached[fName]?
			return _cached[fName]
		else
			fs.readFile fName, "utf8", (err, res) ->
				return cb(err) if err?
				tmpl = Handlebars.compile(res)
				_cached[fName] = tmpl
				cb null, tmpl

Handlebars.registerHelper "commaList", (list) ->
	_out = _.clone(list)
	return new Handlebars.SafeString(_out.join(", "))

Handlebars.registerHelper "paramList", (list) ->
	_out = _.pluck list, "name"
	return new Handlebars.SafeString(_out.join(", "))


layoutToPath = (layoutName) ->
	indir("tmpl/layouts/#{layoutName}.handlebars")

defaultLayout = "default"

render = (templateName, options, cb) ->
	_templatePath = indir path.join("tmpl/", "#{templateName}.handlebars") 
	console.log _templatePath
	unless options.layout?
		options.layout = defaultLayout
	options.title ?= null
	loadHandle layoutToPath(options.layout), (err, lay) ->
		loadHandle _templatePath, (err, tmpl) ->
			contents = tmpl(options)
			html = lay({contents: contents, title: options.title})
			cb null, html


module.exports =
	render: render