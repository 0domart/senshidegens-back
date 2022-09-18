// @flow

const{BufferLayout} = require('buffer-layout');

/**
 * Layout for a public key
 */
 exports.publicKey = (property = 'publicKey') => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
 exports.uint64 = (property = 'uint64') => {
  return BufferLayout.blob(8, property);
};