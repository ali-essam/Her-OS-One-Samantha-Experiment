(function() {
  function pairs(str) {
    var pairs = [],
      length = str.length - 1,
      pair;
    str = str.toLowerCase();
    for (var i = 0; i < length; i++) {
      pair = str.substr(i, 2);
      if (!/\s/.test(pair)) {
        pairs.push(pair);
      }
    }
    return pairs;
  }

  function similarity(pairs1, pairs2) {
    var union = pairs1.length + pairs2.length,
      hits = 0;

    for (var i = 0; i < pairs1.length; i++) {
      for (var j = 0; j < pairs1.length; j++) {
        if (pairs1[i] == pairs2[j]) {
          pairs2.splice(j--, 1);
          hits++;
          break;
        }
      }
    }
    return 2 * hits / union || 0;
  }

  String.prototype.fuzzy = function(strings, floor) {
    var str1 = this,
      pairs1 = pairs(this);

    if (str1.length > 1 && strings.length > 1) return similarity(pairs1, pairs(strings))
    else return 1 * (str1.toLowerCase() == strings.toLowerCase());
  };
})();
