// Generated by CoffeeScript 1.6.3
(function() {
  var URI, URICollection, URLCOUNT, URL_INDICES, add, assert, isURI, urlList, _, _i, _ref, _ref1, _results;

  assert = require("better-assert");

  _ = require("underscore");

  _ref = require("../index.js"), URICollection = _ref.URICollection, isURI = _ref.isURI;

  URI = require("URIjs");

  urlList = ["http://www.google.com/foo", "http://www.cnn.com/theNewsIGuess", "http://www.bing.com/yeahWeNamedItBing/", "http://www.foo.com/index.html", "http://www.bar.net/scrubadub", "http://www.powwow.net", "http://www.genericrecipes.net", "http://www.whatevs.co.uk", "http://www.justcats.com"];

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
      _urls = _.clone(urlList);
      return collection = new URICollection(_urls);
    });
    describe("at", function() {
      it("should return a URIjs instance", function() {
        return assert(collection.at(3) instanceof URI);
      });
      it("should return a URIjs instance with a `.toString()` value equal to the string value at index `i` of the collection's `.toArray()` output.", function() {
        var i, stringArray, _j, _results1;
        stringArray = collection.toString();
        _results1 = [];
        for (i = _j = 0; _j <= 5; i = ++_j) {
          _results1.push(assert(collection.at(i).toString() === stringArray[i]));
        }
        return _results1;
      });
      it("should return null if there is no URL instance at that index.", function() {
        var badIndex;
        badIndex = collection.size() + 1;
        return assert(collection.at(badIndex) === null);
      });
      return it("should return the (N - 1)th from the last element if a negative index is passed.", function() {
        var fromEnd, fromStart, i, size, _j, _ref2, _results1;
        size = collection.size();
        _results1 = [];
        for (i = _j = 0, _ref2 = size - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          fromStart = i;
          fromEnd = (size - i) * -1;
          _results1.push(assert(collection.at(fromStart).toString() === collection.at(fromEnd).toString()));
        }
        return _results1;
      });
    });
    describe("first", function() {
      it("if N==null or N==1, should return a URIjs instance", function() {
        assert(collection.first() instanceof URI);
        return assert(collection.first(1) instanceof URI);
      });
      it("if N>1, should return a URICollection instance.", function() {
        assert(collection.first(2) instanceof URICollection);
        return assert(collection.first(4) instanceof URICollection);
      });
      it("if N>1, should return a collection with N elements.", function() {
        var n, nVals, _j, _len, _results1;
        nVals = [2, 5, 3];
        _results1 = [];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          _results1.push(assert(collection.first(n).size() === n));
        }
        return _results1;
      });
      return it("should return the first N elements", function() {
        var firsted, i, n, nVals, _index, _j, _k, _len, _ref2;
        nVals = [2, 5, 3];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          firsted = collection.first(n);
          assert(firsted.size() === n);
          for (i = _k = 0, _ref2 = n - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
            _index = i;
            assert(firsted.at(i).toString() === collection.at(_index).toString());
          }
        }
        return assert(collection.first().toString() === collection.at(0).toString());
      });
    });
    describe("last", function() {
      it("if N==null or N==1, should return a URIjs instance", function() {
        assert(collection.last() instanceof URI);
        return assert(collection.last(1) instanceof URI);
      });
      it("if N>1, should return a URICollection instance.", function() {
        assert(collection.last(2) instanceof URICollection);
        return assert(collection.last(4) instanceof URICollection);
      });
      it("if N>1, should return a collection with N elements.", function() {
        var n, nVals, _j, _len, _results1;
        nVals = [2, 5, 3];
        _results1 = [];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          _results1.push(assert(collection.last(n).size() === n));
        }
        return _results1;
      });
      return it("should return the last N elements", function() {
        var i, lasted, n, nVals, size, _index, _j, _k, _len, _ref2;
        nVals = [2, 4];
        size = collection.size();
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          lasted = collection.last(n);
          assert(lasted.size() === n);
          for (i = _k = 0, _ref2 = n - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
            _index = (size - n) + i;
            assert(lasted.at(i).toString() === collection.at(_index).toString());
          }
        }
        return assert(collection.last().toString() === collection.at(size - 1).toString());
      });
    });
    describe("rest", function() {
      it("should return a URICollection instance for any N, including null", function() {
        assert(collection.rest() instanceof URICollection);
        return assert(collection.rest(3) instanceof URICollection);
      });
      it("if n is null, should return a number of elements equal to `size() - 1`", function() {
        var size;
        size = collection.size();
        return assert(collection.rest().size() === (size - 1));
      });
      it("if n is NOT null, should return a number of elements equal to `size() - n`", function() {
        var n, nVals, size, _j, _len, _results1;
        nVals = [2, 5, 3];
        size = collection.size();
        _results1 = [];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          _results1.push(assert(collection.rest(n).size() === (size - n)));
        }
        return _results1;
      });
      return it("should return the elements from index N to the end.", function() {
        var i, n, nVals, rested, size, _index, _j, _len, _results1;
        nVals = [2, 3];
        size = collection.size();
        _results1 = [];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          rested = collection.rest(n);
          _results1.push((function() {
            var _k, _ref2, _results2;
            _results2 = [];
            for (i = _k = 0, _ref2 = n - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
              _index = i + n;
              _results2.push(assert(rested.at(i).toString() === collection.at(_index).toString()));
            }
            return _results2;
          })());
        }
        return _results1;
      });
    });
    return describe("initial", function() {
      it("should return a URICollection instance for any N, including null.", function() {
        assert(collection.initial() instanceof URICollection);
        return assert(collection.initial(3) instanceof URICollection);
      });
      it("if n is null, should return a number of elements equal to `size() - 1`", function() {
        var size;
        size = collection.size();
        return assert(collection.initial().size() === (size - 1));
      });
      it("if n is NOT null, should return a number of elements equal to `size() - n`", function() {
        var n, nVals, size, _j, _len, _results1;
        nVals = [2, 5, 3];
        size = collection.size();
        _results1 = [];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          _results1.push(assert(collection.initial(n).size() === (size - n)));
        }
        return _results1;
      });
      return it("should return the elements from index 0 to (size - (n+1)).", function() {
        var i, initialed, n, nVals, size, _index, _j, _len, _results1;
        nVals = [1, 3, 4];
        size = collection.size();
        _results1 = [];
        for (_j = 0, _len = nVals.length; _j < _len; _j++) {
          n = nVals[_j];
          initialed = collection.initial(n);
          _results1.push((function() {
            var _k, _ref2, _results2;
            _results2 = [];
            for (i = _k = 0, _ref2 = n - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
              _index = i;
              _results2.push(assert(initialed.at(i).toString() === collection.at(_index).toString()));
            }
            return _results2;
          })());
        }
        return _results1;
      });
    });
  });

}).call(this);
