About
====

I wanted to find out what the most popular words are in the [Book of Mormon](http://lds.org/scriptures/bofm) in Spanish and then create flashcards for them.

Installation
===

```bash
git clone https://github.com/coolaj86/lds-scriptures-utils-js
pushd lds-scriptures-utils-js
npm install
```

Usage
====

Edit `config.js` to suite your needs and then run

```bash
node get-scriptures
```

TODO
====

  * Download and save to disk first
  * Don't redownload if saved to disk
  * Create JSON representation of footnotes rather than removing them
