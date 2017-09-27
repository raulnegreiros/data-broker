/* jshint node: true */
"use strict";

function flattenJson(preamble, document, ret) {
  if (ret == undefined) {
    ret = {};
  }
  for (let attribute in document) {
    if (document.hasOwnProperty(attribute)) {
      if (typeof(document[attribute]) === 'object') {
        flattenJson((preamble === '' ? '' : preamble + '.') + attribute, document[attribute], ret);
      } else {
        ret['' + (preamble === '' ? '' : preamble + '.') + attribute] = {
          'value' : document[attribute],
          'type' : typeof(document[attribute]),
          'metadata' : {
            'timestamp' : Date.now()
          }
        };
      }
    }
  }
  return ret;
}

exports.flattenJson = flattenJson;