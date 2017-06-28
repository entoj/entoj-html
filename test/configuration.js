'use strict';

/**
 * Configure path
 */
const path = require('path');
global.HTML_SOURCE = path.resolve(__dirname + '/../source');
global.HTML_FIXTURES = path.resolve(__dirname + '/__fixtures__');
global.HTML_TEST = __dirname;

/**
 * Configure chai
 */
const chai = require('chai');
chai.config.includeStack = true;
global.expect = chai.expect;
