
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

loadHandle = (fName, cb) ->
	fs.readFile fName, "utf8", (err, res) ->
		return cb(err) if err?
		tmpl = Handlebars.compile(res)
		cb null, tmpl

Handlebars.registerHelper "commaList", (list) ->
	_out = _.clone(list)
	return new Handlebars.SafeString(_out.join(", "))

Handlebars.registerHelper "paramList", (list) ->
	_out = _.pluck list, "name"
	return new Handlebars.SafeString(_out.join(", "))

readJSON indir("doxed.json"), (err, data) ->

	mapped = _.defaults data, {description: "NULL", ctx: null}
	mapped2 = _.map mapped, (el) ->
		_.pick el, ["tags", "description", "ctx"]

	mapped3 = _.map mapped2, (el) ->
		_outs = {}
		_outs.params = _.where el.tags, {type: 'param'}
		_outs.retval = _.findWhere el.tags, {type: 'return'}
		_outs.description = "NULL"
		if el.description.full?
			_outs.description = el.description.full
		if el.ctx?
			_outs.ident =
				name: el.ctx.name
				type: el.ctx.method
				string: el.ctx.string
		else
			_outs.ident =
				name: 'unknown'


		_outs

	mapped3 = _.sortBy mapped3, (el) -> el.ident.name
	toRender =
		items: mapped3
		title: "API"
		linkName: "API"

	#console.log mapped3
	musty = require indir("superstache.coffee")
	musty.render "dox", toRender, (err, html) ->
		fs.writeFile indir("../api.html"), html, (err) ->
			console.log "done"

###