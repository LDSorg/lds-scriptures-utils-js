(function () {
  'use strict';

  var request = require('request')
    , forAllAsync = require('forAllAsync').forAllAsync
    , fs = require('fs')
    , jsdom = require('jsdom')
    , jqueryCreate = require('jquery')
    , config = require('./config')
    , map = require('./map')
    ;

  function create(_config) {
    config = _config || config;
    var language = map.languages[(config.language || 'english').toLowerCase()]
      , scripture = map.scriptures[(config.scripture || 'book of mormon').toLowerCase()]
      , resource = "http://lds.org/scriptures/" + scripture + "?lang=" + language
      , dictionary = {}
      , chapters = []
      ;

    function readChapter(next, book, chapter) {
      var resource = "http://lds.org/scriptures/" + scripture + "/" + book + "/" + chapter + "?lang=" + language
        , htmlpath = scripture + '.' + book + '.' + chapter + '-' + language + '.html'
        ;

      function processHtml(data) {
        jsdom.env(data, function (errors, window) {
          var $ = jqueryCreate(window)
            , verses = $("div#content div.verses")
            , chwords = []
            , words
            ;

          chapters.push(chwords);

          words = verses.html().toLowerCase()
            .replace(/<sup.*?sup>/g,' ')
            .replace(/<span class="verse".*?span>/g, ' ')
            .replace(/<.*?>/g, ' ')
            .replace(/[\.,"'\?!;:#\$%&\(\)\*\+-\/<>=@\[\]\\\^_{}|~]/g, ' ')
            .replace(/\s+/g, ',')
            .split(',')
            ;

          words.forEach(function (word) {
            if (dictionary[word]) {
              dictionary[word] += 1;
            } else {
              dictionary[word] = 1;
              chwords.push(word);
            }
          });

          console.log('meta', Object.keys(dictionary).length, book, chapter, chwords.length);
          readChapter(next, book, chapter + 1);
        });
      }

      if (fs.existsSync(htmlpath)) {
        processHtml(fs.readFileSync(htmlpath, 'utf8'));
      } else {
        request(resource, function (err, client, data) {
          if (client.statusCode >= 300) {
            return next();
          }

          data = data.toString();
          fs.writeFileSync(htmlpath, data, 'utf8');
          processHtml(data);
        });
      }
    }

    console.log('resource', resource);
    request.get(resource, function (err, thing, data) {
      jsdom.env(data.toString(), function (errors, window) {
        console.log('requested', data);
        var $ = jqueryCreate(window)
          , bookElements = $("div#primary div.table-of-contents ul.books li")
          , books = []
          ;

        try {
          Object.keys(bookElements).forEach(function (i) {
            var book = bookElements[i];
            books.push($(book).attr('id'));
          });
        } catch (e) {
          // console.log(e);
        }

        console.log("downloading...");
        forAllAsync(books, function (next, book) {
          readChapter(next, book, 1);
        }, 20).then(function () {
          var dictpath = './dictionary.' + scripture  + '.' + language + '.json'
            , chaptpath = './chapters.' + scripture + '.' + language + '.json'
            ;

          console.log('dictionary', dictionary);
          console.log('chapters', chapters);
          if (!fs.existsSync(dictpath)) {
            fs.writeFileSync(dictpath, JSON.stringify(dictionary));
          }
          if (!fs.existsSync(chaptpath)) {
            fs.writeFileSync(chaptpath, JSON.stringify(chapters));
          }
        });

      });
    });
  }

  create();
}());
