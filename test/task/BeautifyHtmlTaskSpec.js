'use strict';

/**
 * Requirements
 */
const BeautifyHtmlTask = require(HTML_SOURCE + '/task/BeautifyHtmlTask.js').BeautifyHtmlTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const taskSpec = require('entoj-system/test').task.TaskShared;
const transformingTaskSpec = require('entoj-system/test').task.TransformingTaskShared;
const co = require('co');
const through2 = require('through2');
const VinylFile = require('vinyl');


/**
 * Spec
 */
describe(BeautifyHtmlTask.className, function()
{
    /**
     * BaseTask Test
     */
    transformingTaskSpec(BeautifyHtmlTask, 'task/BeautifyHtmlTask', prepareParameters);

    /**
     */
    function prepareParameters(parameters)
    {
        parameters.unshift(global.fixtures.cliLogger);
        return parameters;
    }


    /**
     * BeautifyHtmlTask Test
     */
    beforeEach(function()
    {
        global.fixtures = {};
        global.fixtures.cliLogger = new CliLogger();
        global.fixtures.cliLogger.muted = true;
    });


    describe('#stream()', function()
    {
        it('should beautify all streamed files', function()
        {
            const promise = co(function *()
            {
                const sourceStream = through2(
                    {
                        objectMode: true
                    });
                sourceStream.write(new VinylFile(
                    {
                        path: 'test.html',
                        contents: new Buffer('<div><div><span>Hi</span></div></div>')
                    }));
                sourceStream.end();

                const testee = new BeautifyHtmlTask(global.fixtures.cliLogger);
                const data = yield taskSpec.readStream(testee.stream(sourceStream));
                for (const file of data)
                {
                    expect(file.contents.toString()).to.be.equal('<div>\n    <div>\n        <span>\n            Hi</span>\n    </div>\n</div>');
                }
            });
            return promise;
        });
    });
});
