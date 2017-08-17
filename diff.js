const jsdiff = require('diff');

module.exports = (text1, text2) => jsdiff.diffWords(text1, text2)
   .map(({ added, removed, value }) => added || removed
      ? `<span class="bg-${added ? 'success' : 'error'}">${value}</span>`
      : value)
   .join('');
