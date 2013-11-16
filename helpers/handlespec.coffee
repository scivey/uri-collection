
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

readJSON indir("spec.json"), (err, data) ->
	mapped = _.chain(data.tests)
		.map( _.clone )
		.map( (el) -> 
			splitTitle = el.fullTitle.split(" ")
			el.topFam = splitTitle[0]
			el.subFam = splitTitle[1]
			el.testDesc = splitTitle.slice(2).join(" ")
			el
			)
		.groupBy( "subFam" )
		.pairs()
		.map( (el) -> {suite: el[0], tests: el[1]} )
		.value()

	toRender =
		title: "Test Results"
		stats:
			total: data.stats.tests
			passes: data.stats.passes
		testSuites: mapped

	#console.log mapped[0]

	loadHandle indir("tmpl/spec.handlebars"), (err, tmpl) ->
		html = tmpl(toRender)
		fs.writeFile indir("spec.html"), html, (err) ->
			console.log "done"
