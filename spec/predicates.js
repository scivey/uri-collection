// Generated by CoffeeScript 1.6.3
(function() {
  var URI, URICollection, URLCOUNT, URL_INDICES, assert, isURI, urlList, _, _i, _ref, _ref1, _results;

  assert = require("better-assert");

  _ = require("underscore");

  _ref = require("../index.js"), URICollection = _ref.URICollection, isURI = _ref.isURI;

  URI = require("URIjs");

  urlList = ["http://www.google.com/foo", "http://www.cnn.com/theNewsIGuess", "http://www.foo.com/index.html", "http://www.powwow.net", "http://www.genericrecipes.net", "http://ihavefeelingsandiwriteaboutthem.wordpress.com", "http://www.savethefuzzies.org", "http://justcats.tumblr.com"];

  URLCOUNT = urlList.length;

  URL_INDICES = (function() {
    _results = [];
    for (var _i = 0, _ref1 = URLCOUNT - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; 0 <= _ref1 ? _i++ : _i--){ _results.push(_i); }
    return _results;
  }).apply(this);

  describe("URICollection", function() {
    var collection, _urls;
    _urls = _.clone(urlList);
    collection = {};
    beforeEach(function() {
      return collection = new URICollection(_urls);
    });
    describe("some", function() {
      it("should return true if any collection elements pass the truth test", function() {
        var tlds;
        tlds = ["net", "com", "org"];
        return _.each(tlds, function(oneTop) {
          var result;
          result = collection.some(function(el) {
            return el.tld() === oneTop;
          });
          return assert(result === true);
        });
      });
      return it("should return false if zero collection elements pass the truth test", function() {
        var tlds;
        tlds = ["moo", "zappa", "swoosh"];
        return _.each(tlds, function(oneTop) {
          var result;
          result = collection.some(function(el) {
            return el.tld() === oneTop;
          });
          return assert(result === false);
        });
      });
    });
    describe("every", function() {
      it("should return true if all collection elements pass the truth test", function() {
        var result;
        result = collection.every(function(el) {
          return el.protocol() === "http";
        });
        return assert(result === true);
      });
      return it("should return false if any collection elements fail the truth test", function() {
        var tlds;
        tlds = ["net", "com", "org"];
        return _.each(tlds, function(oneTop) {
          var result;
          result = collection.every(function(el) {
            return el.tld() === oneTop;
          });
          return assert(result === false);
        });
      });
    });
    return describe("contains", function() {
      var containsColl, containsUrls;
      containsUrls = [];
      containsColl = {};
      beforeEach(function() {
        containsUrls = ["http://www.google.com/foo", "http://www.cnn.com/theNewsIGuess", "http://www.foo.com/index.html", "http://www.powwow.net/"];
        return containsColl = new URICollection(containsUrls);
      });
      it("when passed a string, returns true if the string is equal to the `.toString()` result of any element.", function() {
        var result;
        result = containsColl.contains("http://www.powwow.net/");
        return assert(result === true);
      });
      it("when passed a string, returns false if the string is not equal to the `.toString()` result of any element.", function() {
        var result;
        result = containsColl.contains("http://www.jollyhumorousanecdotes.net/");
        return assert(result === false);
      });
      it("when passed a URLjs instance, returns true if the `.toString()` of that instance equals the `.toString()` of any element.", function() {
        var result;
        result = containsColl.contains(new URI("http://www.powwow.net"));
        return assert(result === true);
      });
      it("when passed a URLjs instance, returns false if the `.toString()` of that instance does not equal the `.toString()` of any element.", function() {
        var result;
        result = containsColl.contains(new URI("http://www.jollyhumorousanecdotes.net/"));
        return assert(result === false);
      });
      it("when passed a RegExp instance, returns true if calling that RegExp's `#test()` with any element's `.toString()` value returns true.", function() {
        var result;
        result = containsColl.contains(/^.*www.*$/i);
        return assert(result === true);
      });
      return it("when passed a RegExp instance, returns false if calling that RegExp's `#test()` with every element's `.toString()` value returns false.", function() {
        var result;
        result = containsColl.contains(/^.*grognogblog.*$/i);
        return assert(result === false);
      });
    });
  });

}).call(this);
