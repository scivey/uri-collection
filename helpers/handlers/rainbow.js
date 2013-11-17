/**
 * Copyright 2013 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Rainbow is a simple code syntax highlighter
 *
 * @preserve @version 1.2
 * @url rainbowco.de
 */
var Rainbow = (function() {

    /**
     * array of replacements to process at the end
     *
     * @type {Object}
     */
    var replacements = {},

        /**
         * an array of start and end positions of blocks to be replaced
         *
         * @type {Object}
         */
        replacement_positions = {},

        /**
         * an array of the language patterns specified for each language
         *
         * @type {Object}
         */
        language_patterns = {},

        /**
         * an array of languages and whether they should bypass the default patterns
         *
         * @type {Object}
         */
        bypass_defaults = {},

        /**
         * processing level
         *
         * replacements are stored at this level so if there is a sub block of code
         * (for example php inside of html) it runs at a different level
         *
         * @type {number}
         */
        CURRENT_LEVEL = 0,

        /**
         * constant used to refer to the default language
         *
         * @type {number}
         */
        DEFAULT_LANGUAGE = 0,

        /**
         * used as counters so we can selectively call setTimeout
         * after processing a certain number of matches/replacements
         *
         * @type {number}
         */
        match_counter = 0,

        /**
         * @type {number}
         */
        replacement_counter = 0,

        /**
         * @type {null|string}
         */
        global_class,

        /**
         * @type {null|Function}
         */
        onHighlight;

    /**
     * cross browser get attribute for an element
     *
     * @see http://stackoverflow.com/questions/3755227/cross-browser-javascript-getattribute-method
     *
     * @param {Node} el
     * @param {string} attr     attribute you are trying to get
     * @returns {string|number}
     */
    function _attr(el, attr, attrs, i) {
        var result = (el.getAttribute && el.getAttribute(attr)) || 0;

        if (!result) {
            attrs = el.attributes;

            for (i = 0; i < attrs.length; ++i) {
                if (attrs[i].nodeName === attr) {
                    return attrs[i].nodeValue;
                }
            }
        }

        return result;
    }

    /**
     * adds a class to a given code block
     *
     * @param {Element} el
     * @param {string} class_name   class name to add
     * @returns void
     */
    function _addClass(el, class_name) {
        el.className += el.className ? ' ' + class_name : class_name;
    }

    /**
     * checks if a block has a given class
     *
     * @param {Element} el
     * @param {string} class_name   class name to check for
     * @returns {boolean}
     */
    function _hasClass(el, class_name) {
        return (' ' + el.className + ' ').indexOf(' ' + class_name + ' ') > -1;
    }

    /**
     * gets the language for this block of code
     *
     * @param {Element} block
     * @returns {string|null}
     */
    function _getLanguageForBlock(block) {

        // if this doesn't have a language but the parent does then use that
        // this means if for example you have: <pre data-language="php">
        // with a bunch of <code> blocks inside then you do not have
        // to specify the language for each block
        var language = _attr(block, 'data-language') || _attr(block.parentNode, 'data-language');

        // this adds support for specifying language via a css class
        // you can use the Google Code Prettify style: <pre class="lang-php">
        // or the HTML5 style: <pre><code class="language-php">
        if (!language) {
            var pattern = /\blang(?:uage)?-(\w+)/,
                match = block.className.match(pattern) || block.parentNode.className.match(pattern);

            if (match) {
                language = match[1];
            }
        }

        return language;
    }

    /**
     * makes sure html entities are always used for tags
     *
     * @param {string} code
     * @returns {string}
     */
    function _htmlEntities(code) {
        return code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&(?![\w\#]+;)/g, '&amp;');
    }

    /**
     * determines if a new match intersects with an existing one
     *
     * @param {number} start1    start position of existing match
     * @param {number} end1      end position of existing match
     * @param {number} start2    start position of new match
     * @param {number} end2      end position of new match
     * @returns {boolean}
     */
    function _intersects(start1, end1, start2, end2) {
        if (start2 >= start1 && start2 < end1) {
            return true;
        }

        return end2 > start1 && end2 < end1;
    }

    /**
     * determines if two different matches have complete overlap with each other
     *
     * @param {number} start1   start position of existing match
     * @param {number} end1     end position of existing match
     * @param {number} start2   start position of new match
     * @param {number} end2     end position of new match
     * @returns {boolean}
     */
    function _hasCompleteOverlap(start1, end1, start2, end2) {

        // if the starting and end positions are exactly the same
        // then the first one should stay and this one should be ignored
        if (start2 == start1 && end2 == end1) {
            return false;
        }

        return start2 <= start1 && end2 >= end1;
    }

    /**
     * determines if the match passed in falls inside of an existing match
     * this prevents a regex pattern from matching inside of a bigger pattern
     *
     * @param {number} start - start position of new match
     * @param {number} end - end position of new match
     * @returns {boolean}
     */
    function _matchIsInsideOtherMatch(start, end) {
        for (var key in replacement_positions[CURRENT_LEVEL]) {
            key = parseInt(key, 10);

            // if this block completely overlaps with another block
            // then we should remove the other block and return false
            if (_hasCompleteOverlap(key, replacement_positions[CURRENT_LEVEL][key], start, end)) {
                delete replacement_positions[CURRENT_LEVEL][key];
                delete replacements[CURRENT_LEVEL][key];
            }

            if (_intersects(key, replacement_positions[CURRENT_LEVEL][key], start, end)) {
                return true;
            }
        }

        return false;
    }

    /**
     * takes a string of code and wraps it in a span tag based on the name
     *
     * @param {string} name     name of the pattern (ie keyword.regex)
     * @param {string} code     block of code to wrap
     * @returns {string}
     */
    function _wrapCodeInSpan(name, code) {
        return '<span class="' + name.replace(/\./g, ' ') + (global_class ? ' ' + global_class : '') + '">' + code + '</span>';
    }

    /**
     * finds out the position of group match for a regular expression
     *
     * @see http://stackoverflow.com/questions/1985594/how-to-find-index-of-groups-in-match
     *
     * @param {Object} match
     * @param {number} group_number
     * @returns {number}
     */
    function _indexOfGroup(match, group_number) {
        var index = 0,
            i;

        for (i = 1; i < group_number; ++i) {
            if (match[i]) {
                index += match[i].length;
            }
        }

        return index;
    }

    /**
     * matches a regex pattern against a block of code
     * finds all matches that should be processed and stores the positions
     * of where they should be replaced within the string
     *
     * this is where pretty much all the work is done but it should not
     * be called directly
     *
     * @param {RegExp} pattern
     * @param {string} code
     * @returns void
     */
    function _processPattern(regex, pattern, code, callback)
    {
        var match = regex.exec(code);

        if (!match) {
            return callback();
        }

        ++match_counter;

        // treat match 0 the same way as name
        if (!pattern['name'] && typeof pattern['matches'][0] == 'string') {
            pattern['name'] = pattern['matches'][0];
            delete pattern['matches'][0];
        }

        var replacement = match[0],
            start_pos = match.index,
            end_pos = match[0].length + start_pos,

            /**
             * callback to process the next match of this pattern
             */
            processNext = function() {
                var nextCall = function() {
                    _processPattern(regex, pattern, code, callback);
                };

                // every 100 items we process let's call set timeout
                // to let the ui breathe a little
                return match_counter % 100 > 0 ? nextCall() : setTimeout(nextCall, 0);
            };

        // if this is not a child match and it falls inside of another
        // match that already happened we should skip it and continue processing
        if (_matchIsInsideOtherMatch(start_pos, end_pos)) {
            return processNext();
        }

        /**
         * callback for when a match was successfully processed
         *
         * @param {string} replacement
         * @returns void
         */
        var onMatchSuccess = function(replacement) {
                // if this match has a name then wrap it in a span tag
                if (pattern['name']) {
                    replacement = _wrapCodeInSpan(pattern['name'], replacement);
                }

                // console.log('LEVEL', CURRENT_LEVEL, 'replace', match[0], 'with', replacement, 'at position', start_pos, 'to', end_pos);

                // store what needs to be replaced with what at this position
                if (!replacements[CURRENT_LEVEL]) {
                    replacements[CURRENT_LEVEL] = {};
                    replacement_positions[CURRENT_LEVEL] = {};
                }

                replacements[CURRENT_LEVEL][start_pos] = {
                    'replace': match[0],
                    'with': replacement
                };

                // store the range of this match so we can use it for comparisons
                // with other matches later
                replacement_positions[CURRENT_LEVEL][start_pos] = end_pos;

                // process the next match
                processNext();
            },

            // if this pattern has sub matches for different groups in the regex
            // then we should process them one at a time by rerunning them through
            // this function to generate the new replacement
            //
            // we run through them backwards because the match position of earlier
            // matches will not change depending on what gets replaced in later
            // matches
            group_keys = keys(pattern['matches']),

            /**
             * callback for processing a sub group
             *
             * @param {number} i
             * @param {Array} group_keys
             * @param {Function} callback
             */
            processGroup = function(i, group_keys, callback) {
                if (i >= group_keys.length) {
                    return callback(replacement);
                }

                var processNextGroup = function() {
                        processGroup(++i, group_keys, callback);
                    },
                    block = match[group_keys[i]];

                // if there is no match here then move on
                if (!block) {
                    return processNextGroup();
                }

                var group = pattern['matches'][group_keys[i]],
                    language = group['language'],

                    /**
                     * process group is what group we should use to actually process
                     * this match group
                     *
                     * for example if the subgroup pattern looks like this
                     * 2: {
                     *     'name': 'keyword',
                     *     'pattern': /true/g
                     * }
                     *
                     * then we use that as is, but if it looks like this
                     *
                     * 2: {
                     *     'name': 'keyword',
                     *     'matches': {
                     *          'name': 'special',
                     *          'pattern': /whatever/g
                     *      }
                     * }
                     *
                     * we treat the 'matches' part as the pattern and keep
                     * the name around to wrap it with later
                     */
                    process_group = group['name'] && group['matches'] ? group['matches'] : group,

                    /**
                     * takes the code block matched at this group, replaces it
                     * with the highlighted block, and optionally wraps it with
                     * a span with a name
                     *
                     * @param {string} block
                     * @param {string} replace_block
                     * @param {string|null} match_name
                     */
                    _replaceAndContinue = function(block, replace_block, match_name) {
                        replacement = _replaceAtPosition(_indexOfGroup(match, group_keys[i]), block, match_name ? _wrapCodeInSpan(match_name, replace_block) : replace_block, replacement);
                        processNextGroup();
                    };

                // if this is a sublanguage go and process the block using that language
                if (language) {
                    return _highlightBlockForLanguage(block, language, function(code) {
                        _replaceAndContinue(block, code);
                    });
                }

                // if this is a string then this match is directly mapped to selector
                // so all we have to do is wrap it in a span and continue
                if (typeof group === 'string') {
                    return _replaceAndContinue(block, block, group);
                }

                // the process group can be a single pattern or an array of patterns
                // _processCodeWithPatterns always expects an array so we convert it here
                _processCodeWithPatterns(block, process_group.length ? process_group : [process_group], function(code) {
                    _replaceAndContinue(block, code, group['matches'] ? group['name'] : 0);
                });
            };

        processGroup(0, group_keys, onMatchSuccess);
    }

    /**
     * should a language bypass the default patterns?
     *
     * if you call Rainbow.extend() and pass true as the third argument
     * it will bypass the defaults
     */
    function _bypassDefaultPatterns(language)
    {
        return bypass_defaults[language];
    }

    /**
     * returns a list of regex patterns for this language
     *
     * @param {string} language
     * @returns {Array}
     */
    function _getPatternsForLanguage(language) {
        var patterns = language_patterns[language] || [],
            default_patterns = language_patterns[DEFAULT_LANGUAGE] || [];

        return _bypassDefaultPatterns(language) ? patterns : patterns.concat(default_patterns);
    }

    /**
     * substring replace call to replace part of a string at a certain position
     *
     * @param {number} position         the position where the replacement should happen
     * @param {string} replace          the text we want to replace
     * @param {string} replace_with     the text we want to replace it with
     * @param {string} code             the code we are doing the replacing in
     * @returns {string}
     */
    function _replaceAtPosition(position, replace, replace_with, code) {
        var sub_string = code.substr(position);
        return code.substr(0, position) + sub_string.replace(replace, replace_with.replace('$\'', '$$$$\''));
    }

   /**
     * sorts an object by index descending
     *
     * @param {Object} object
     * @return {Array}
     */
    function keys(object) {
        var locations = [],
            replacement,
            pos;

        for(var location in object) {
            if (object.hasOwnProperty(location)) {
                locations.push(location);
            }
        }

        // numeric descending
        return locations.sort(function(a, b) {
            return b - a;
        });
    }

    /**
     * processes a block of code using specified patterns
     *
     * @param {string} code
     * @param {Array} patterns
     * @returns void
     */
    function _processCodeWithPatterns(code, patterns, callback)
    {
        // we have to increase the level here so that the
        // replacements will not conflict with each other when
        // processing sub blocks of code
        ++CURRENT_LEVEL;

        // patterns are processed one at a time through this function
        function _workOnPatterns(patterns, i)
        {
            // still have patterns to process, keep going
            if (i < patterns.length) {
                return _processPattern(patterns[i]['pattern'], patterns[i], code, function() {
                    _workOnPatterns(patterns, ++i);
                });
            }

            // we are done processing the patterns
            // process the replacements and update the DOM
            _processReplacements(code, function(code) {

                // when we are done processing replacements
                // we are done at this level so we can go back down
                delete replacements[CURRENT_LEVEL];
                delete replacement_positions[CURRENT_LEVEL];
                --CURRENT_LEVEL;
                callback(code);
            });
        }

        _workOnPatterns(patterns, 0);
    }

    /**
     * process replacements in the string of code to actually update the markup
     *
     * @param {string} code         the code to process replacements in
     * @param {Function} onComplete   what to do when we are done processing
     * @returns void
     */
    function _processReplacements(code, onComplete) {

        /**
         * processes a single replacement
         *
         * @param {string} code
         * @param {Array} positions
         * @param {number} i
         * @param {Function} onComplete
         * @returns void
         */
        function _processReplacement(code, positions, i, onComplete) {
            if (i < positions.length) {
                ++replacement_counter;
                var pos = positions[i],
                    replacement = replacements[CURRENT_LEVEL][pos];
                code = _replaceAtPosition(pos, replacement['replace'], replacement['with'], code);

                // process next function
                var next = function() {
                    _processReplacement(code, positions, ++i, onComplete);
                };

                // use a timeout every 250 to not freeze up the UI
                return replacement_counter % 250 > 0 ? next() : setTimeout(next, 0);
            }

            onComplete(code);
        }

        var string_positions = keys(replacements[CURRENT_LEVEL]);
        _processReplacement(code, string_positions, 0, onComplete);
    }

    /**
     * takes a string of code and highlights it according to the language specified
     *
     * @param {string} code
     * @param {string} language
     * @param {Function} onComplete
     * @returns void
     */
    function _highlightBlockForLanguage(code, language, onComplete) {
        var patterns = _getPatternsForLanguage(language);
        _processCodeWithPatterns(_htmlEntities(code), patterns, onComplete);
    }

    /**
     * highlight an individual code block
     *
     * @param {Array} code_blocks
     * @param {number} i
     * @returns void
     */
    function _highlightCodeBlock(code_blocks, i, onComplete) {
        if (i < code_blocks.length) {
            var block = code_blocks[i],
                language = _getLanguageForBlock(block);

            if (!_hasClass(block, 'rainbow') && language) {
                language = language.toLowerCase();

                _addClass(block, 'rainbow');

                return _highlightBlockForLanguage(block.innerHTML, language, function(code) {
                    block.innerHTML = code;

                    // reset the replacement arrays
                    replacements = {};
                    replacement_positions = {};

                    // if you have a listener attached tell it that this block is now highlighted
                    if (onHighlight) {
                        onHighlight(block, language);
                    }

                    // process the next block
                    setTimeout(function() {
                        _highlightCodeBlock(code_blocks, ++i, onComplete);
                    }, 0);
                });
            }
            return _highlightCodeBlock(code_blocks, ++i, onComplete);
        }

        if (onComplete) {
            onComplete();
        }
    }

    /**
     * start highlighting all the code blocks
     *
     * @returns void
     */
    function _highlight(node, onComplete) {

        // the first argument can be an Event or a DOM Element
        // I was originally checking instanceof Event but that makes it break
        // when using mootools
        //
        // @see https://github.com/ccampbell/rainbow/issues/32
        //
        node = node && typeof node.getElementsByTagName == 'function' ? node : document;

        var pre_blocks = node.getElementsByTagName('pre'),
            code_blocks = node.getElementsByTagName('code'),
            i,
            final_pre_blocks = [],
            final_code_blocks = [];

        // first loop through all pre blocks to find which ones to highlight
        // also strip whitespace
        for (i = 0; i < pre_blocks.length; ++i) {

            // strip whitespace around code tags when they are inside of a pre tag
            // this makes the themes look better because you can't accidentally
            // add extra linebreaks at the start and end
            //
            // when the pre tag contains a code tag then strip any extra whitespace
            // for example
            // <pre>
            //      <code>var foo = true;</code>
            // </pre>
            //
            // will become
            // <pre><code>var foo = true;</code></pre>
            //
            // if you want to preserve whitespace you can use a pre tag on its own
            // without a code tag inside of it
            if (pre_blocks[i].getElementsByTagName('code').length) {
                pre_blocks[i].innerHTML = pre_blocks[i].innerHTML.replace(/^\s+/, '').replace(/\s+$/, '');
                continue;
            }

            // if the pre block has no code blocks then we are going to want to
            // process it directly
            final_pre_blocks.push(pre_blocks[i]);
        }

        // @see http://stackoverflow.com/questions/2735067/how-to-convert-a-dom-node-list-to-an-array-in-javascript
        // we are going to process all <code> blocks
        for (i = 0; i < code_blocks.length; ++i) {
            final_code_blocks.push(code_blocks[i]);
        }

        _highlightCodeBlock(final_code_blocks.concat(final_pre_blocks), 0, onComplete);
    }

    /**
     * public methods
     */
    return {

        /**
         * extends the language pattern matches
         *
         * @param {*} language     name of language
         * @param {*} patterns      array of patterns to add on
         * @param {boolean|null} bypass      if true this will bypass the default language patterns
         */
        extend: function(language, patterns, bypass) {

            // if there is only one argument then we assume that we want to
            // extend the default language rules
            if (arguments.length == 1) {
                patterns = language;
                language = DEFAULT_LANGUAGE;
            }

            bypass_defaults[language] = bypass;
            language_patterns[language] = patterns.concat(language_patterns[language] || []);
        },

        /**
         * call back to let you do stuff in your app after a piece of code has been highlighted
         *
         * @param {Function} callback
         */
        onHighlight: function(callback) {
            onHighlight = callback;
        },

        /**
         * method to set a global class that will be applied to all spans
         *
         * @param {string} class_name
         */
        addClass: function(class_name) {
            global_class = class_name;
        },

        /**
         * starts the magic rainbow
         *
         * @returns void
         */
        color: function() {

            // if you want to straight up highlight a string you can pass the string of code,
            // the language, and a callback function
            if (typeof arguments[0] == 'string') {
                return _highlightBlockForLanguage(arguments[0], arguments[1], arguments[2]);
            }

            // if you pass a callback function then we rerun the color function
            // on all the code and call the callback function on complete
            if (typeof arguments[0] == 'function') {
                return _highlight(0, arguments[0]);
            }

            // otherwise we use whatever node you passed in with an optional
            // callback function as the second parameter
            _highlight(arguments[0], arguments[1]);
        }
    };
}) ();

// When using Google closure compiler in advanced mode some methods
// get renamed.  This keeps a public reference to these methods so they can
// still be referenced from outside this library.
Rainbow["onHighlight"] = Rainbow.onHighlight;
Rainbow["addClass"] = Rainbow.addClass;


Rainbow.extend([
    {
        'matches': {
            1: {
                'name': 'keyword.operator',
                'pattern': /\=/g
            },
            2: {
                'name': 'string',
                'matches': {
                    'name': 'constant.character.escape',
                    'pattern': /\\('|"){1}/g
                }
            }
        },
        'pattern': /(\(|\s|\[|\=|:)(('|")([^\\\1]|\\.)*?(\3))/gm
    },
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\/|(\/\/|\#)[\s\S]*?$/gm
    },
    {
        'name': 'constant.numeric',
        'pattern': /\b(\d+(\.\d+)?(e(\+|\-)?\d+)?(f|d)?|0x[\da-f]+)\b/gi
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(and|array|as|b(ool(ean)?|reak)|c(ase|atch|har|lass|on(st|tinue))|d(ef|elete|o(uble)?)|e(cho|lse(if)?|xit|xtends|xcept)|f(inally|loat|or(each)?|unction)|global|if|import|int(eger)?|long|new|object|or|pr(int|ivate|otected)|public|return|self|st(ring|ruct|atic)|switch|th(en|is|row)|try|(un)?signed|var|void|while)(?=\(|\b)/gi
    },
    {
        'name': 'constant.language',
        'pattern': /true|false|null/g
    },
    {
        'name': 'keyword.operator',
        'pattern': /\+|\!|\-|&(gt|lt|amp);|\||\*|\=/g
    },
    {
        'matches': {
            1: 'function.call'
        },
        'pattern': /(\w+?)(?=\()/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(function)\s(.*?)(?=\()/g
    }
]);



/**
 * Javascript patterns
 *
 * @author Craig Campbell
 * @version 1.0.9
 */
Rainbow.extend('javascript', [

    /**
     * matches $. or $(
     */
    {
        'name': 'selector',
        'pattern': /(\s|^)\$(?=\.|\()/g
    },
    {
        'name': 'support',
        'pattern': /\b(window|document)\b/g
    },
    {
        'matches': {
            1: 'support.property'
        },
        'pattern': /\.(length|node(Name|Value))\b/g
    },
    {
        'matches': {
            1: 'support.function'
        },
        'pattern': /(setTimeout|setInterval)(?=\()/g

    },
    {
        'matches': {
            1: 'support.method'
        },
        'pattern': /\.(getAttribute|push|getElementById|getElementsByClassName|log|setTimeout|setInterval)(?=\()/g
    },

    /**
     * matches any escaped characters inside of a js regex pattern
     *
     * @see https://github.com/ccampbell/rainbow/issues/22
     *
     * this was causing single line comments to fail so it now makes sure
     * the opening / is not directly followed by a *
     *
     * @todo check that there is valid regex in match group 1
     */
    {
        'name': 'string.regexp',
        'matches': {
            1: 'string.regexp.open',
            2: {
                'name': 'constant.regexp.escape',
                'pattern': /\\(.){1}/g
            },
            3: 'string.regexp.close',
            4: 'string.regexp.modifier'
        },
        'pattern': /(\/)(?!\*)(.+)(\/)([igm]{0,3})/g
    },

    /**
     * matches runtime function declarations
     */
    {
        'matches': {
            1: 'storage',
            3: 'entity.function'
        },
        'pattern': /(var)?(\s|^)(\S*)(?=\s?=\s?function\()/g
    },

    /**
     * matches constructor call
     */
    {
        'matches': {
            1: 'keyword',
            2: 'entity.function'
        },
        'pattern': /(new)\s+(.*)(?=\()/g
    },

    /**
     * matches any function call in the style functionName: function()
     */
    {
        'name': 'entity.function',
        'pattern': /(\w+)(?=:\s{0,}function)/g
    }
]);


/**
 * Coffeescript patterns
 *
 * @author Craig Campbell
 * @version 1.0
 */
Rainbow.extend('coffeescript', [
    {
        'name': 'comment.block',
        'pattern': /(\#{3})[\s\S]*\1/gm
    },
    {
        'name': 'string.block',
        'pattern': /('{3}|"{3})[\s\S]*\1/gm
    },

    /**
     * multiline regex with comments
     */
    {
        'name': 'string.regex',
        'matches': {
            2: {
                'name': 'comment',
                'pattern': /\#(.*?)\n/g
            }
        },
        'pattern': /(\/{3})([\s\S]*)\1/gm
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(in|when|is|isnt|of|not|unless|until|super)(?=\b)/gi
    },
    {
        'name': 'keyword.operator',
        'pattern': /\?/g
    },
    {
        'name': 'constant.language',
        'pattern': /\b(undefined|yes|on|no|off)\b/g
    },
    {
        'name': 'keyword.variable.coffee',
        'pattern': /@(\w+)/gi
    },

    /**
     * reset global keywards from generic
     */
    {
        'name': 'reset',
        'pattern': /object|class|print/gi
    },

    /**
     * named function
     */
    {
        'matches' : {
            1: 'entity.name.function',
            2: 'keyword.operator',
            3: {
                    'name': 'function.argument.coffee',
                    'pattern': /([\@\w]+)/g
            },
            4: 'keyword.function'
        },
        'pattern': /(\w+)\s{0,}(=|:)\s{0,}\((.*?)((-|=)&gt;)/gi
    },

    /**
     * anonymous function
     */
    {
        'matches': {
            1: {
                    'name': 'function.argument.coffee',
                    'pattern': /([\@\w]+)/g
            },
            2: 'keyword.function'
        },
        'pattern': /\s\((.*?)\)\s{0,}((-|=)&gt;)/gi
    },

    /**
     * direct function no arguments
     */
    {
        'matches' : {
            1: 'entity.name.function',
            2: 'keyword.operator',
            3: 'keyword.function'
        },
        'pattern': /(\w+)\s{0,}(=|:)\s{0,}((-|=)&gt;)/gi
    },

    /**
     * class definitions
     */
    {
        'matches': {
            1: 'storage.class',
            2: 'entity.name.class',
            3: 'storage.modifier.extends',
            4: 'entity.other.inherited-class'
        },
        'pattern': /\b(class)\s(\w+)(\sextends\s)?([\w\\]*)?\b/g
    },

    /**
     * object instantiation
     */
    {
        'matches': {
            1: 'keyword.new',
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /\b(new)\s(.*?)(?=\s)/g
    }
]);


/**
 * C patterns
 *
 * @author Daniel Holden
 * @author Craig Campbell
 * @version 1.0.7
 */
Rainbow.extend('c', [
    {
        'name': 'meta.preprocessor',
        'matches': {
            1: [
                {
                    'matches': {
                        1: 'keyword.define',
                        2: 'entity.name'
                    },
                    'pattern': /(\w+)\s(\w+)\b/g
                },
                {
                    'name': 'keyword.define',
                    'pattern': /endif/g
                },
                {
                    'name': 'constant.numeric',
                    'pattern': /\d+/g
                },
                {
                    'matches': {
                        1: 'keyword.include',
                        2: 'string'
                    },
                    'pattern': /(include)\s(.*?)$/g
                }
            ]
        },
        'pattern': /\#([\S\s]*?)$/gm
    },
    {
        'name': 'keyword',
        'pattern': /\b(do|goto|typedef)\b/g
    },
    {
        'name': 'entity.label',
        'pattern': /\w+:/g
    },
    {
        'matches': {
            1: 'storage.type',
            3: 'storage.type',
            4: 'entity.name.function'
        },
        'pattern': /\b((un)?signed|const)? ?(void|char|short|int|long|float|double)\*? +((\w+)(?= ?\())?/g
    },
    {
        'matches': {
            2: 'entity.name.function'
        },
        'pattern': /(\w|\*) +((\w+)(?= ?\())/g
    },
    {
        'name': 'storage.modifier',
        'pattern': /\b(static|extern|auto|register|volatile|inline)\b/g
    },
    {
        'name': 'support.type',
        'pattern': /\b(struct|union|enum)\b/g
    }
]);


/**
 * CSS patterns
 *
 * @author Craig Campbell
 * @version 1.0.9
 */
Rainbow.extend('css', [
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\//gm
    },
    {
        'name': 'constant.hex-color',
        'pattern': /#([a-f0-9]{3}|[a-f0-9]{6})(?=;|\s|,|\))/gi
    },
    {
        'matches': {
            1: 'constant.numeric',
            2: 'keyword.unit'
        },
        'pattern': /(\d+)(px|em|cm|s|%)?/g
    },
    {
        'name': 'string',
        'pattern': /('|")(.*?)\1/g
    },
    {
        'name': 'support.css-property',
        'matches': {
            1: 'support.vendor-prefix'
        },
        'pattern': /(-o-|-moz-|-webkit-|-ms-)?[\w-]+(?=\s?:)(?!.*\{)/g
    },
    {
        'matches': {
            1: [
                {
                    'name': 'entity.name.sass',
                    'pattern': /&amp;/g
                },
                {
                    'name': 'direct-descendant',
                    'pattern': /&gt;/g
                },
                {
                    'name': 'entity.name.class',
                    'pattern': /\.[\w\-_]+/g
                },
                {
                    'name': 'entity.name.id',
                    'pattern': /\#[\w\-_]+/g
                },
                {
                    'name': 'entity.name.pseudo',
                    'pattern': /:[\w\-_]+/g
                },
                {
                    'name': 'entity.name.tag',
                    'pattern': /\w+/g
                }
            ]
        },
        'pattern': /([\w\ ,\n:\.\#\&\;\-_]+)(?=.*\{)/g
    },
    {
        'matches': {
            2: 'support.vendor-prefix',
            3: 'support.css-value'
        },
        'pattern': /(:|,)\s*(-o-|-moz-|-webkit-|-ms-)?([a-zA-Z-]*)(?=\b)(?!.*\{)/g
    }
], true);

/**
 * HTML patterns
 *
 * @author Craig Campbell
 * @version 1.0.9
 */
Rainbow.extend('html', [
    {
        'name': 'source.php.embedded',
        'matches': {
            2: {
                'language': 'php'
            }
        },
        'pattern': /&lt;\?=?(?!xml)(php)?([\s\S]*?)(\?&gt;)/gm
    },
    {
        'name': 'source.css.embedded',
        'matches': {
            1: {
                'matches': {
                    1: 'support.tag.style',
                    2: [
                        {
                            'name': 'entity.tag.style',
                            'pattern': /^style/g
                        },
                        {
                            'name': 'string',
                            'pattern': /('|")(.*?)(\1)/g
                        },
                        {
                            'name': 'entity.tag.style.attribute',
                            'pattern': /(\w+)/g
                        }
                    ],
                    3: 'support.tag.style'
                },
                'pattern': /(&lt;\/?)(style.*?)(&gt;)/g
            },
            2: {
                'language': 'css'
            },
            3: 'support.tag.style',
            4: 'entity.tag.style',
            5: 'support.tag.style'
        },
        'pattern': /(&lt;style.*?&gt;)([\s\S]*?)(&lt;\/)(style)(&gt;)/gm
    },
    {
        'name': 'source.js.embedded',
        'matches': {
            1: {
                'matches': {
                    1: 'support.tag.script',
                    2: [
                        {
                            'name': 'entity.tag.script',
                            'pattern': /^script/g
                        },

                        {
                            'name': 'string',
                            'pattern': /('|")(.*?)(\1)/g
                        },
                        {
                            'name': 'entity.tag.script.attribute',
                            'pattern': /(\w+)/g
                        }
                    ],
                    3: 'support.tag.script'
                },
                'pattern': /(&lt;\/?)(script.*?)(&gt;)/g
            },
            2: {
                'language': 'javascript'
            },
            3: 'support.tag.script',
            4: 'entity.tag.script',
            5: 'support.tag.script'
        },
        'pattern': /(&lt;script(?! src).*?&gt;)([\s\S]*?)(&lt;\/)(script)(&gt;)/gm
    },
    {
        'name': 'comment.html',
        'pattern': /&lt;\!--[\S\s]*?--&gt;/g
    },
    {
        'matches': {
            1: 'support.tag.open',
            2: 'support.tag.close'
        },
        'pattern': /(&lt;)|(\/?\??&gt;)/g
    },
    {
        'name': 'support.tag',
        'matches': {
            1: 'support.tag',
            2: 'support.tag.special',
            3: 'support.tag-name'
        },
        'pattern': /(&lt;\??)(\/|\!?)(\w+)/g
    },
    {
        'matches': {
            1: 'support.attribute'
        },
        'pattern': /([a-z-]+)(?=\=)/gi
    },
    {
        'matches': {
            1: 'support.operator',
            2: 'string.quote',
            3: 'string.value',
            4: 'string.quote'
        },
        'pattern': /(=)('|")(.*?)(\2)/g
    },
    {
        'matches': {
            1: 'support.operator',
            2: 'support.value'
        },
        'pattern': /(=)([a-zA-Z\-0-9]*)\b/g
    },
    {
        'matches': {
            1: 'support.attribute'
        },
        'pattern': /\s(\w+)(?=\s|&gt;)(?![\s\S]*&lt;)/g
    }
], true);

/**
 * Haskell patterns
 *
 * @author Bruno Dias
 * @version 1.0.1
 */
//TODO: {-# ... #-} stuff...
Rainbow.extend('haskell', [
    ///- Comments
    {
        'name': 'comment',
        'pattern': /\{\-\-[\s\S(\w+)]+[\-\-][\}$]/gm
        // /\{\-{2}[\s\S(.*)]+[\-\-][\}$]/gm [multiple lines]
    }, 
    {
        'name': 'comment',
        'pattern': /\-\-(.*)/g
        // /\-\-\s(.+)$/gm [single]
    },
    ///- End Comments
    
    ///- Namespace (module)
    {
        'matches': {
            1: 'keyword',
            2: 'support.namespace'
        },
        'pattern': /\b(module)\s(\w+)\s[\(]?(\w+)?[\)?]\swhere/g
    },
    ///- End Namespace (module)
    
    ///- Keywords and Operators
    {
        'name': 'keyword.operator',
        'pattern': /\+|\!|\-|&(gt|lt|amp);|\/\=|\||\@|\:|\.|\+{2}|\:|\*|\=|#|\.{2}|(\\)[a-zA-Z_]/g
    },
    {
        'name': 'keyword',
        'pattern': /\b(case|class|foreign|hiding|qualified|data|family|default|deriving|do|else|if|import|in|infix|infixl|infixr|instance|let|in|otherwise|module|newtype|of|then|type|where)\b/g
    },
    {
        'name': 'keyword',
        'pattern': /[\`][a-zA-Z_']*?[\`]/g
    },
    ///- End Keywords and Operators


    ///- Infix|Infixr|Infixl
    {
        'matches': {
            1: 'keyword',
            2: 'keyword.operator'
        },
        'pattern': /\b(infix|infixr|infixl)+\s\d+\s(\w+)*/g
    },
    ///- End Infix|Infixr|Infixl
    
    {
        'name': 'entity.class',
        'pattern': /\b([A-Z][A-Za-z0-9_']*)/g
    },

    // From c.js
    {
        'name': 'meta.preprocessor',
        'matches': {
            1: [
                {
                    'matches': {
                        1: 'keyword.define',
                        2: 'entity.name'
                    },
                    'pattern': /(\w+)\s(\w+)\b/g
                },
                {
                    'name': 'keyword.define',
                    'pattern': /endif/g
                },
                {
                    'name': 'constant.numeric',
                    'pattern': /\d+/g
                },
                {
                    'matches': {
                        1: 'keyword.include',
                        2: 'string'
                    },
                 'pattern': /(include)\s(.*?)$/g
                }
            ]
        },
        'pattern': /^\#([\S\s]*?)$/gm
    }
]); 

/**
 * Ruby patterns
 *
 * @author Matthew King
 * @author Jesse Farmer <jesse@20bits.com>
 * @author actsasflinn
 * @version 1.0.6
 */

Rainbow.extend('ruby', [
    /**
    * __END__ DATA
    */
    {
        'matches': {
            1: 'variable.language',
            2: {
              'language': null
            },
        },
        //find __END__ and consume remaining text
        'pattern': /^(__END__)\n((?:.*\n)*)/gm
    },
    /**
     * Strings
     *   1. No support for multi-line strings
     */
    {
        'name': 'string',
        'matches': {
            1: 'string.open',
            2: [{
                'name': 'string.interpolation',
                'matches': {
                    1: 'string.open',
                    2: {
                      'language': 'ruby'
                    },
                    3: 'string.close'
                },
                'pattern': /(\#\{)(.*?)(\})/g
            }],
            3: 'string.close'
        },
        'pattern': /("|`)(.*?[^\\\1])?(\1)/g
    },
    {
        'name': 'string',
        'pattern': /('|"|`)([^\\\1\n]|\\.)*?\1/g
    },
    {
        'name': 'string',
        'pattern': /%[qQ](?=(\(|\[|\{|&lt;|.)(.*?)(?:'|\)|\]|\}|&gt;|\1))(?:\(\2\)|\[\2\]|\{\2\}|\&lt;\2&gt;|\1\2\1)/g
    },
    /**
     * Heredocs
     * Heredocs of the form `<<'HTML' ... HTML` are unsupported.
     */
    {
        'matches': {
            1: 'string',
            2: 'string',
            3: 'string'
        },
        'pattern': /(&lt;&lt;)(\w+).*?$([\s\S]*?^\2)/gm
    },
    {
        'matches': {
            1: 'string',
            2: 'string',
            3: 'string'
        },
        'pattern': /(&lt;&lt;\-)(\w+).*?$([\s\S]*?\2)/gm
    },
    /**
     * Regular expressions
     * Escaped delimiter (`/\//`) is unsupported.
     */
    {
        'name': 'string.regexp',
        'matches': {
            1: 'string.regexp',
            2: {
                'name': 'string.regexp',
                'pattern': /\\(.){1}/g
            },
            3: 'string.regexp',
            4: 'string.regexp'
        },
        'pattern': /(\/)(.*?)(\/)([a-z]*)/g
    },
    {
        'name': 'string.regexp',
        'matches': {
            1: 'string.regexp',
            2: {
                'name': 'string.regexp',
                'pattern': /\\(.){1}/g
            },
            3: 'string.regexp',
            4: 'string.regexp'
        },
        'pattern': /%r(?=(\(|\[|\{|&lt;|.)(.*?)('|\)|\]|\}|&gt;|\1))(?:\(\2\)|\[\2\]|\{\2\}|\&lt;\2&gt;|\1\2\1)([a-z]*)/g
    },
    /**
     * Comments
     */
    {
        'name': 'comment',
        'pattern': /#.*$/gm
    },
    {
        'name': 'comment',
        'pattern': /^\=begin[\s\S]*?\=end$/gm
    },
    /**
     * Symbols
     */
    {
        'matches': {
            1: 'constant'
        },
        'pattern': /(\w+:)[^:]/g
    },
    {
        'matches': {
            1: 'constant.symbol'
        },
        'pattern': /[^:](:(?:\w+|(?=['"](.*?)['"])(?:"\2"|'\2')))/g
    },
    {
        'name': 'constant.numeric',
        'pattern': /\b(0x[\da-f]+|\d+)\b/g
    },
    {
        'name': 'support.class',
        'pattern': /\b[A-Z]\w*(?=((\.|::)[A-Za-z]|\[))/g
    },
    {
        'name': 'constant',
        'pattern': /\b[A-Z]\w*\b/g
    },
    /**
     * Keywords, variables, constants, and operators
     *   In Ruby some keywords are valid method names, e.g., MyClass#yield
     *   Don't mark those instances as "keywords"
     */
    {
        'matches': {
            1: 'storage.class',
            2: 'entity.name.class',
            3: 'entity.other.inherited-class'
        },
        'pattern': /\s*(class)\s+((?:(?:::)?[A-Z]\w*)+)(?:\s+&lt;\s+((?:(?:::)?[A-Z]\w*)+))?/g
    },
    {
        'matches': {
            1: 'storage.module',
            2: 'entity.name.class'
        },
        'pattern': /\s*(module)\s+((?:(?:::)?[A-Z]\w*)+)/g
    },
    {
        'name': 'variable.global',
        'pattern': /\$([a-zA-Z_]\w*)\b/g
    },
    {
        'name': 'variable.class',
        'pattern': /@@([a-zA-Z_]\w*)\b/g
    },
    {
        'name': 'variable.instance',
        'pattern': /@([a-zA-Z_]\w*)\b/g
    },
    {
        'matches': {
            1: 'keyword.control'
        },
        'pattern': /[^\.]\b(BEGIN|begin|case|class|do|else|elsif|END|end|ensure|for|if|in|module|rescue|then|unless|until|when|while)\b(?![?!])/g
    },
    {
        'matches': {
            1: 'keyword.control.pseudo-method'
        },
        'pattern': /[^\.]\b(alias|alias_method|break|next|redo|retry|return|super|undef|yield)\b(?![?!])|\bdefined\?|\bblock_given\?/g
    },
    {
        'matches': {
            1: 'constant.language'
        },
        'pattern': /\b(nil|true|false)\b(?![?!])/g
    },
    {
        'matches': {
            1: 'variable.language'
        },
        'pattern': /\b(__(FILE|LINE)__|self)\b(?![?!])/g
    },
    {
        'matches': {
            1: 'keyword.special-method'
        },
        'pattern': /\b(require|gem|initialize|new|loop|include|extend|raise|attr_reader|attr_writer|attr_accessor|attr|catch|throw|private|module_function|public|protected)\b(?![?!])/g
    },
    {
        'name': 'keyword.operator',
        'pattern': /\s\?\s|=|&lt;&lt;|&lt;&lt;=|%=|&=|\*=|\*\*=|\+=|\-=|\^=|\|{1,2}=|&lt;&lt;|&lt;=&gt;|&lt;(?!&lt;|=)|&gt;(?!&lt;|=|&gt;)|&lt;=|&gt;=|===|==|=~|!=|!~|%|&amp;|\*\*|\*|\+|\-|\/|\||~|&gt;&gt;/g
    },
    {
        'matches': {
            1: 'keyword.operator.logical'
        },
        'pattern': /[^\.]\b(and|not|or)\b/g
    },

    /**
    * Functions
    *   1. No support for marking function parameters
    */
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(def)\s(.*?)(?=(\s|\())/g
    }
], true);

/**
 * Shell patterns
 *
 * @author Matthew King
 * @author Craig Campbell
 * @version 1.0.3
 */
Rainbow.extend('shell', [
    /**
     * This handles the case where subshells contain quotes.
     * For example: `"$(resolve_link "$name" || true)"`.
     *
     * Caveat: This really should match balanced parentheses, but cannot.
     * @see http://stackoverflow.com/questions/133601/can-regular-expressions-be-used-to-match-nested-patterns
     */
    {
        'name': 'shell',
        'matches': {
            1: {
                'language': 'shell'
            }
        },
        'pattern': /\$\(([\s\S]*?)\)/gm
    },
    {
        'matches': {
            2: 'string'
        },
        'pattern': /(\(|\s|\[|\=)(('|")[\s\S]*?(\3))/gm
    },
    {
        'name': 'keyword.operator',
        'pattern': /&lt;|&gt;|&amp;/g
    },
    {
        'name': 'comment',
        'pattern': /\#[\s\S]*?$/gm
    },
    {
        'name': 'storage.function',
        'pattern': /(.+?)(?=\(\)\s{0,}\{)/g
    },
    /**
     * Environment variables
     */
    {
        'name': 'support.command',
        'pattern': /\b(echo|rm|ls|(mk|rm)dir|cd|find|cp|exit|pwd|exec|trap|source|shift|unset)/g
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(break|case|continue|do|done|elif|else|esac|eval|export|fi|for|function|if|in|local|return|set|then|unset|until|while)(?=\(|\b)/g
    }
], true);

/**
 * Lua patterns
 *
 * @author Javier Aguirre
 * @version 1.0.1
 */
Rainbow.extend('lua', [
    {
        'matches': {
            1: {
                'name': 'keyword.operator',
                'pattern': /\=/g
            },
            2: {
                'name': 'string',
                'matches': {
                    'name': 'constant.character.escape',
                    'pattern': /\\('|"){1}/g
                }
            }
        },
        'pattern': /(\(|\s|\[|\=)(('|")([^\\\1]|\\.)*?(\3))/gm
    },
    {
        'name': 'comment',
        'pattern': /\-{2}\[{2}\-{2}[\s\S]*?\-{2}\]{2}\-{2}|(\-{2})[\s\S]*?$/gm
    },
    {
        'name': 'constant.numeric',
        'pattern': /\b(\d+(\.\d+)?(e(\+|\-)?\d+)?(f|d)?|0x[\da-f]+)\b/gi
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b((a|e)nd|in|repeat|break|local|return|do|for|then|else(if)?|function|not|if|or|until|while)(?=\(|\b)/gi
    },
    {
        'name': 'constant.language',
        'pattern': /true|false|nil/g
    },
    {
        'name': 'keyword.operator',
        'pattern': /\+|\!|\-|&(gt|lt|amp);|\||\*|\=|#|\.{2}/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(function)\s+(\w+[\:|\.]?\w+?)(?=\()/g
    },
    {
        'matches': {
            1: 'support.function'
        },
        'pattern': /\b(print|require|module|\w+\.\w+)(?=\()/g
    }
], true);

/**
 * Python patterns
 *
 * @author Craig Campbell
 * @version 1.0.9
 */
Rainbow.extend('python', [
    /**
     * don't highlight self as a keyword
     */
    {
        'name': 'variable.self',
        'pattern': /self/g
    },
    {
        'name': 'constant.language',
        'pattern': /None|True|False|NotImplemented|\.\.\./g
    },
    {
        'name': 'support.object',
        'pattern': /object/g
    },

    /**
     * built in python functions
     *
     * this entire list is 580 bytes minified / 379 bytes gzipped
     *
     * @see http://docs.python.org/library/functions.html
     *
     * @todo strip some out or consolidate the regexes with matching patterns?
     */
    {
        'name': 'support.function.python',
        'pattern': /\b(bs|divmod|input|open|staticmethod|all|enumerate|int|ord|str|any|eval|isinstance|pow|sum|basestring|execfile|issubclass|print|super|bin|file|iter|property|tuple|bool|filter|len|range|type|bytearray|float|list|raw_input|unichr|callable|format|locals|reduce|unicode|chr|frozenset|long|reload|vars|classmethod|getattr|map|repr|xrange|cmp|globals|max|reversed|zip|compile|hasattr|memoryview|round|__import__|complex|hash|min|set|apply|delattr|help|next|setattr|buffer|dict|hex|object|slice|coerce|dir|id|oct|sorted|intern)(?=\()/g
    },
    {
        'matches': {
            1: 'keyword'
        },
        'pattern': /\b(pass|lambda|with|is|not|in|from|elif|raise|del)(?=\(|\b)/g
    },
    {
        'matches': {
            1: 'storage.class',
            2: 'entity.name.class',
            3: 'entity.other.inherited-class'
        },
        'pattern': /(class)\s+(\w+)\((\w+?)\)/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'support.magic'
        },
        'pattern': /(def)\s+(__\w+)(?=\()/g
    },
    {
        'name': 'support.magic',
        'pattern': /__(name)__/g
    },
    {
        'matches': {
            1: 'keyword.control',
            2: 'support.exception.type'
        },
        'pattern': /(except) (\w+):/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(def)\s+(\w+)(?=\()/g
    },
    {
        'name': 'entity.name.function.decorator',
        'pattern': /@([\w\.]+)/g
    },
    {
        'name': 'comment.docstring',
        'pattern': /('{3}|"{3})[\s\S]*?\1/gm
    }
]);

/**
 * PHP patterns
 *
 * @author Craig Campbell
 * @version 1.0.8
 */
Rainbow.extend('php', [
    {
        'name': 'support',
        'pattern': /\becho\b/g
    },
    {
        'matches': {
            1: 'variable.dollar-sign',
            2: 'variable'
        },
        'pattern': /(\$)(\w+)\b/g
    },
    {
        'name': 'constant.language',
        'pattern': /true|false|null/ig
    },
    {
        'name': 'constant',
        'pattern': /\b[A-Z0-9_]{2,}\b/g
    },
    {
        'name': 'keyword.dot',
        'pattern': /\./g
    },
    {
        'name': 'keyword',
        'pattern': /\b(die|end(for(each)?|switch|if)|case|require(_once)?|include(_once)?)(?=\(|\b)/g
    },
    {
        'matches': {
            1: 'keyword',
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /(instanceof)\s([^\$].*?)(\)|;)/g
    },

    /**
     * these are the top 50 most used PHP functions
     * found from running a script and checking the frequency of each function
     * over a bunch of popular PHP frameworks then combining the results
     */
    {
        'matches': {
            1: 'support.function'
        },
        'pattern': /\b(array(_key_exists|_merge|_keys|_shift)?|isset|count|empty|unset|printf|is_(array|string|numeric|object)|sprintf|each|date|time|substr|pos|str(len|pos|tolower|_replace|totime)?|ord|trim|in_array|implode|end|preg_match|explode|fmod|define|link|list|get_class|serialize|file|sort|mail|dir|idate|log|intval|header|chr|function_exists|dirname|preg_replace|file_exists)(?=\()/g
    },
    {
        'name': 'variable.language.php-tag',
        'pattern': /(&lt;\?(php)?|\?&gt;)/g
    },
    {
        'matches': {
            1: 'keyword.namespace',
            2: {
                'name': 'support.namespace',
                'pattern': /\w+/g
            }
        },
        'pattern': /\b(namespace|use)\s(.*?);/g
    },
    {
        'matches': {
            1: 'storage.modifier',
            2: 'storage.class',
            3: 'entity.name.class',
            4: 'storage.modifier.extends',
            5: 'entity.other.inherited-class',
            6: 'storage.modifier.extends',
            7: 'entity.other.inherited-class'
        },
        'pattern': /\b(abstract|final)?\s?(class|interface|trait)\s(\w+)(\sextends\s)?([\w\\]*)?(\simplements\s)?([\w\\]*)?\s?\{?(\n|\})/g
    },
    {
        'name': 'keyword.static',
        'pattern': /self::|static::/g
    },
    {
        'matches': {
            1: 'storage.function',
            2: 'support.magic'
        },
        'pattern': /(function)\s(__.*?)(?=\()/g
    },
    {
        'matches': {
            1: 'keyword.new',
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /\b(new)\s([^\$].*?)(?=\)|\(|;)/g
    },
    {
        'matches': {
            1: {
                'name': 'support.class',
                'pattern': /\w+/g
            },
            2: 'keyword.static'
        },
        'pattern': /([\w\\]*?)(::)(?=\b|\$)/g
    },
    {
        'matches': {
            2: {
                'name': 'support.class',
                'pattern': /\w+/g
            }
        },
        'pattern': /(\(|,\s?)([\w\\]*?)(?=\s\$)/g
    }
]);

/**
* Java patterns
*
* @author Leo Accend
* @version 1.0.0
*/
Rainbow.extend( "java", [
  {
    name: "constant",
    pattern: /\b(false|null|true|[A-Z_]+)\b/g
  },
  {
    matches: {
      1: "keyword",
      2: "support.namespace"
    },
    pattern: /(import|package)\s(.+)/g
  },
  {
    // see http://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
    name: "keyword",
    pattern: /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\b/g
  },
  {
    name: "string",
    pattern: /(".*?")/g
  },
  {
    name: "char",
    pattern: /(')(.|\\.|\\u[\dA-Fa-f]{4})\1/g
  },
  {
    name: "integer",
    pattern: /\b(0x[\da-f]+|\d+)L?\b/g
  },
  {
    name: "comment",
    pattern: /\/\*[\s\S]*?\*\/|(\/\/).*?$/gm
  },
  {
    name: "support.annotation",
    pattern: /@\w+/g
  },
  {
    matches: {
      1: "entity.function"
    },
    pattern: /([^@\.\s]+)\(/g
  },
  {
    name: "entity.class",
    pattern: /\b([A-Z]\w*)\b/g
  },
  {
    // see http://docs.oracle.com/javase/tutorial/java/nutsandbolts/operators.html
    name: "operator",
    pattern: /(\+{1,2}|-{1,2}|~|!|\*|\/|%|(?:&lt;){1,2}|(?:&gt;){1,3}|instanceof|(?:&amp;){1,2}|\^|\|{1,2}|\?|:|(?:=|!|\+|-|\*|\/|%|\^|\||(?:&lt;){1,2}|(?:&gt;){1,3})?=)/g
  }
], true );

















/**
 * XML TEST! 
 *
 * @author Scott Ivey
 */
Rainbow.extend('xml', [
    {
        'name': 'source.php.embedded',
        'matches': {
            2: {
                'language': 'php'
            }
        },
        'pattern': /&lt;\?=?(?!xml)(php)?([\s\S]*?)(\?&gt;)/gm
    },
 
    {
        'name': 'source.js.embedded',
        'matches': {
            1: {
                'matches': {
                    1: 'support.tag.script',
                    2: [
                        {
                            'name': 'entity.tag.script',
                            'pattern': /^script/g
                        },

                        {
                            'name': 'string',
                            'pattern': /('|")(.*?)(\1)/g
                        },
                        {
                            'name': 'entity.tag.script.attribute',
                            'pattern': /(\w+)/g
                        }
                    ],
                    3: 'support.tag.script'
                },
                'pattern': /(&lt;\/?)(script.*?)(&gt;)/g
            },
            2: {
                'language': 'javascript'
            },
            3: 'support.tag.script',
            4: 'entity.tag.script',
            5: 'support.tag.script'
        },
        'pattern': /(&lt;script(?! src).*?&gt;)([\s\S]*?)(&lt;\/)(script)(&gt;)/gm
    },
    {
        'name': 'comment.html',
        'pattern': /&lt;\!--[\S\s]*?--&gt;/g
    },
    {
        'matches': {
            1: 'support.tag.open',
            2: 'support.tag.close'
        },
        'pattern': /(&lt;)|(\/?\??&gt;)/g
    },
    {
        'name': 'support.tag',
        'matches': {
            1: 'support.tag',
            2: 'support.tag.special',
            3: 'support.tag-name'
        },
        'pattern': /(&lt;\??)(\/|\!?)(\w+)/g
    },
    {
        'matches': {
            1: 'support.attribute'
        },
        'pattern': /([a-z-]+(:[a-z]+)?)(?=\=)/gi
    },
    {
        'matches': {
            1: 'support.operator',
            2: 'string.quote',
            3: 'string.value',
            4: 'string.quote'
        },
        'pattern': /(=)('|")(.*?)(\2)/g
    },
    {
        'matches': {
            1: 'support.operator',
            2: 'support.value'
        },
        'pattern': /(=)([a-zA-Z\-0-9]*)\b/g
    },
    {
        'matches': {
            1: 'support.attribute'
        },
        'pattern': /\s(\w+)(?=\s|&gt;)(?![\s\S]*&lt;)/g
    }
], true);




module.exports = {
    Rainbow: Rainbow,
}