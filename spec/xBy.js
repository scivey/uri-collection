// Generated by CoffeeScript 1.6.3
(function() {
  var URI, URICollection, URLCOUNT, URL_INDICES, add, assert, isURI, urlList, _, _i, _ref, _ref1, _results;

  assert = require("better-assert");

  _ = require("underscore");

  _ref = require("../index.js"), URICollection = _ref.URICollection, isURI = _ref.isURI;

  URI = require("URIjs");

  urlList = ["http://www.google.com/foo", "http://www.cnn.com/theNewsIGuess", "http://www.foo.com/index.html", "http://www.powwow.net", "http://www.genericrecipes.net", "http://ihavefeelingsandiwriteaboutthem.wordpress.com", "http://justcats.tumblr.com"];

  URLCOUNT = urlList.length;

  URL_INDICES = (function() {
    _results = [];
    for (var _i = 0, _ref1 = URLCOUNT - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; 0 <= _ref1 ? _i++ : _i--){ _results.push(_i); }
    return _results;
  }).apply(this);

  add = function(x, y) {
    return x + y;
  };

  describe("URICollection", function() {
    var collection, _urls;
    _urls = _.clone(urlList);
    collection = {};
    beforeEach(function() {
      return collection = new URICollection(_urls);
    });
    describe("countBy", function() {
      var counterFn;
      counterFn = function(aLink) {
        return aLink.domain() + " " + aLink.tld();
      };
      it("should accept a property string and use the matching property as the counting criteria", function() {
        var counted, i, _j, _len, _results1;
        counted = collection.countBy("domain");
        _results1 = [];
        for (_j = 0, _len = URL_INDICES.length; _j < _len; _j++) {
          i = URL_INDICES[_j];
          _results1.push(assert(_.has(counted, collection.at(i).domain())));
        }
        return _results1;
      });
      it("should accept a function and use it to create the counting criteria", function() {
        var counted, i, _j, _len, _results1;
        counted = collection.countBy(counterFn);
        _results1 = [];
        for (_j = 0, _len = URL_INDICES.length; _j < _len; _j++) {
          i = URL_INDICES[_j];
          _results1.push(assert(_.has(counted, counterFn(collection.at(i)))));
        }
        return _results1;
      });
      return it("should return a total count equal to the number of instances in the collection", function() {
        var counted, funcSum, stringSum;
        counted = collection.countBy("domain");
        stringSum = _.chain(counted).values().reduce(add, 0).value();
        assert(stringSum === collection.size());
        counted = collection.countBy(counterFn);
        funcSum = _.chain(counted).values().reduce(add, 0).value();
        return assert(funcSum === collection.size());
      });
    });
    describe("groupBy", function() {
      var groupingFn;
      groupingFn = function(aLink) {
        return aLink.domain() + " " + aLink.tld();
      };
      it("should accept a property string and use the matching property as the grouping criteria", function() {
        var grouped, i, _j, _len, _results1;
        grouped = collection.groupBy("domain");
        _results1 = [];
        for (_j = 0, _len = URL_INDICES.length; _j < _len; _j++) {
          i = URL_INDICES[_j];
          _results1.push(assert(_.has(grouped, collection.at(i).domain())));
        }
        return _results1;
      });
      it("should accept a function and use it to create the grouping criteria", function() {
        var grouped, i, _j, _len, _results1;
        grouped = collection.groupBy(groupingFn);
        _results1 = [];
        for (_j = 0, _len = URL_INDICES.length; _j < _len; _j++) {
          i = URL_INDICES[_j];
          _results1.push(assert(_.has(grouped, groupingFn(collection.at(i)))));
        }
        return _results1;
      });
      it("should have the same number of keys as the number of unique results for the grouping function over a plain array of the collection's elements.", function() {
        var groupCount, grouped, list, uniqueCount;
        list = collection.toArray();
        uniqueCount = _.chain(list).map(groupingFn).uniq().value().length;
        grouped = collection.groupBy(groupingFn);
        groupCount = _.keys(grouped).length;
        return assert(uniqueCount === groupCount);
      });
      return it("should have the same total number of URIs as the original collection", function() {
        var funcCount, grouped, grouped2, stringCount;
        grouped = collection.groupBy("domain");
        stringCount = _.chain(grouped).values().map(function(oneList) {
          return oneList.size();
        }).reduce(add, 0).value();
        assert(stringCount === collection.size());
        grouped2 = collection.groupBy(groupingFn);
        funcCount = _.chain(grouped2).values().map(function(oneList) {
          return oneList.size();
        }).reduce(add, 0).value();
        return assert(funcCount === collection.size());
      });
    });
    describe("sortBy", function() {
      var sortingFn;
      sortingFn = function(aLink) {
        return aLink.toString().length;
      };
      it("should accept a property string and use the matching property as the sorting criteria", function() {
        var i, manualDomain, sorted, _j, _len, _results1;
        manualDomain = collection.map(function(el) {
          return el.domain();
        });
        manualDomain = _.sortBy(manualDomain, _.identity);
        sorted = collection.sortBy("domain");
        _results1 = [];
        for (_j = 0, _len = URL_INDICES.length; _j < _len; _j++) {
          i = URL_INDICES[_j];
          _results1.push(assert(sorted.at(i).domain() === manualDomain[i]));
        }
        return _results1;
      });
      it("should accept a function and use it to create the sorting criteria", function() {
        var i, manual, sorted, _j, _len, _results1;
        sorted = collection.sortBy(function(aLink) {
          return aLink.toString().length;
        });
        manual = _.sortBy(collection.toString(), function(el) {
          return el.length;
        });
        _results1 = [];
        for (_j = 0, _len = URL_INDICES.length; _j < _len; _j++) {
          i = URL_INDICES[_j];
          _results1.push(assert(sorted.at(i).toString() === manual[i]));
        }
        return _results1;
      });
      it("should return an instance of URICollection", function() {
        var sorted;
        sorted = collection.sortBy("domain");
        return assert(sorted instanceof URICollection);
      });
      return it("should return a collection with the same number of elements as the original.", function() {
        var sorted;
        sorted = collection.sortBy("domain");
        return assert(sorted.size() === collection.size());
      });
    });
    return describe("shuffle", function() {
      it("should return an instance of URICollection", function() {
        var shuffled;
        shuffled = collection.shuffle();
        return assert(shuffled instanceof URICollection);
      });
      it("should return a collection with the same number of elements as the original", function() {
        var shuffled;
        shuffled = collection.shuffle();
        return assert(shuffled.size() === collection.size());
      });
      return it("should return a collection with elements in a different order", function() {
        var orig, pairs, result, shuffled;
        orig = collection.toString();
        shuffled = collection.shuffle().toString();
        pairs = _.zip(orig, shuffled);
        result = _.some(pairs, function(aPair) {
          return aPair[0] !== aPair[1];
        });
        return assert(result === true);
      });
    });
  });

}).call(this);