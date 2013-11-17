_ = require "underscore"
path = require "path"
_.str = require "underscore.string"
fs = require "fs"


log = (msg) -> console.log msg

indir = do ->
	dPath = path.normalize __dirname
	(fPath) ->
		path.join dPath, fPath


colorPipe = do ->
	_pipe = []
	_interval = false
	_working = false
	
	{Rainbow} = require indir("rainbow.js")

	callRainbow = (code, lang, cb) ->
		Rainbow.color code, lang, (highlighted) ->
			cb(null, highlighted)

	pollCycle = ->
		unless _working
			if _pipe.length > 0
				do ->
					_working = true
					_job = _pipe.pop()
					callRainbow _job.code, _job.lang, (err, highlighted) ->
						_job.cb(null, highlighted)
						_working = false

	startPolling = ->
		unless _interval
			_intervalFn = do ->
				_timeoutCounter = 0
				->
					unless _working
						if _pipe.length > 0
							pollCycle()
						else
							_timeoutCounter++
							if _timeoutCounter > 10
								clearInterval _interval
								_interval = false
			_interval = setInterval _intervalFn, 25

	push = (code, lang, cb) ->
		job =
			code: code
			lang: lang
			cb: cb
		_pipe.push job
		startPolling()

	outs =
		push: push


hilite = (code, lang, cb) ->
	colorPipe.push(code, lang, cb)



module.exports = hilite