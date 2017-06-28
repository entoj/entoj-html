'use strict';

/**
 * Requirements
 */
const HtmlFormatter = require(HTML_SOURCE + '/formatter/HtmlFormatter.js').HtmlFormatter;
const formatterSpec = require('entoj-system/test').formatter.FormatterShared;
const co = require('co');


/**
 * Spec
 */
describe(HtmlFormatter.className, function()
{
    /**
     * Formatter Test
     */
    formatterSpec(HtmlFormatter, 'formatter/HtmlFormatter');


    /**
     * HtmlFormatter Test
     */
    describe('#format()', function()
    {
        it('should format html', function()
        {
            const promise = co(function*()
            {
                const source = '<!DOCTYPE html> <html lang="en"> <head><meta charset="UTF-8"> <title>Home</title></head> <body> This is content. </body> </html>';
                const testee = new HtmlFormatter();
                const formatted = yield testee.format(source);
                expect(formatted).to.be.not.equal(source);
            });
            return promise;
        });
    });
});
