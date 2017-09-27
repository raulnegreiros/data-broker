/* jshint node: true */
"use strict";

function flattenJson(preamble, document) {
  let ret = [];
  let obj = {};
  for (let attribute in document) {
    if (document.hasOwnProperty(attribute)) {
      if (typeof(document[attribute]) === 'object') {
        ret = ret.concat(flattenJson((preamble === '' ? '' : preamble + '.') + attribute, document[attribute]));
      } else {
        obj = {};
        obj['' + (preamble === '' ? '' : preamble + '.') + attribute] = document[attribute];
        ret.push(obj);
      }
    }
  }
  return ret;
}

exports.flattenJson = flattenJson;