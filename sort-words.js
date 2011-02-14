(function () {
  "use strict";

  var fs = require('fs');

  fs.readFile('./dictionary-spanish.json', function (err, data) {
    var start = new Date().valueOf(),
      dict = JSON.parse(data),
      sorted = [];

    console.log(start);
    console.log(new Date().valueOf() - start);

    Object.keys(dict).forEach(function (word) {
      sorted.push({
        word: word,
        count: dict[word]
      });
    });

    sorted.sort(function (a, b) {
      if (a.count > b.count) {
        return 1;
      }
      if (a.count < b.count) {
        return -1;
      }
      if (a.word > b.word) {
        return 1;
      }
      if (a.word < b.word) {
        return -1;
      }
      return 0;
    });

    console.log(JSON.stringify(sorted, null, '  '));
  });
}());
