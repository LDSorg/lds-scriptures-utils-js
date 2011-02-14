(function () {
  "use strict";

  require('futures/forEachAsync');

  var request = require('ahr'),
    fs = require('fs'),
    futures = require('futures'),
    jsdom = require('jsdom').jsdom,
    jquery = require('jquery'),
    config = require('./config'),
    map = require('./map');

  function create(_config) {
    config = _config || config;
    language = map.languages[(config.language || 'english').toLowerCase()];
    scripture = map.scriptures[(config.scripture || 'book of mormon').toLowerCase()];

    var dictionary = {},
      chapters = [];

    function readChapter(next, book, chapter) {
      var resource = "http://lds.org/scriptures/" + scripture + "/" + book + "/" + chapter + "?lang=" + language;

      request(resource, function (err, client, data) {
        if (client.statusCode >= 300) {
          return next();
        }

        var document = jsdom(data.toString()),
          window = document.createWindow(),
          $ = jquery.create(window),
          verses = $("div#content div.verses"),
          chwords = [],
          words;

        chapters.push(chwords);

        words = verses.html().toLowerCase()
          .replace(/<sup.*?sup>/g,' ')
          .replace(/<span class="verse".*?span>/g, ' ')
          .replace(/<.*?>/g, ' ')
          .replace(/[\.,"'\?!;:#\$%&\(\)\*\+-\/<>=@\[\]\\\^_{}|~]/g, ' ')
          .replace(/\s+/g, ',')
          .split(',');

        words.forEach(function (word) {
          if (dictionary[word]) {
            dictionary[word] += 1;
          } else {
            dictionary[word] = 1;
            chwords.push(word);
          }
        });
        console.log(Object.keys(dictionary).length, book, chapter, chwords.length);
        readChapter(next, book, chapter + 1);
      });
    }

    var resource = "http://lds.org/scriptures/" + scripture + "?lang=" + language;
    console.log(resource);
    request(resource, function (err, xhr, data) {
      var document = jsdom(data.toString()),
        window = document.createWindow(),
        $ = jquery.create(window),
        bookElements = $("div#primary div.table-of-contents ul.books li"),
        books = [];

      try {
        Object.keys(bookElements).forEach(function (i) {
          var book = bookElements[i];
          books.push($(book).attr('id'));
        });
      } catch (e) {
        // console.log(e);
      }

      console.log("downloading...");
      books.forEachAsync(function (next, book) {
        readChapter(next, book, 1);
      }).then(function () {
        console.log(dictionary);
        console.log(chapters);
        fs.writeFileSync('./dictionary.' + scripture  + '.' + language + '.json', JSON.stringify(dictionary));
        fs.writeFileSync('./chapters.' + scripture + '.' + language + '.json', JSON.stringify(chapters));
      });
    });
  }
  create();
}());
