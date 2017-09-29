function flattenJson(preamble: string, document: any, ret: any) {
  if (ret == null) {
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

export {flattenJson};
