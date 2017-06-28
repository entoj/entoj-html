'use strict';

/**
 * Requirements
 * @ignore
 */
const Formatter = require('entoj-system').formatter.Formatter;
const prettydiff = require('prettydiff');


/**
 * A basic html formatter
 *
 * @class
 * @extends Formatter
 * @memberOf formatter
 */
class HtmlFormatter extends Formatter
{
    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'formatter/HtmlFormatter';
    }


    /**
     * @param {string} content
     * @param {string} options
     * @returns {Promise<Array>}
     */
    format(content, options)
    {
        if (!content || content.trim() === '')
        {
            Promise.resolve('');
        }
        const fileData = Object.assign(
            {
                source: content
            },
            {
                lang: 'html',
                mode: 'beautify',
                commline: true,
                force_indent: true,
                spaceclose: true,
                force_attribute: false,
                wrap: 80
            });
        return Promise.resolve(prettydiff.api(fileData)[0]);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.HtmlFormatter = HtmlFormatter;
