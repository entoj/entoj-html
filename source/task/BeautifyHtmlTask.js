'use strict';

/**
 * Requirements
 * @ignore
 */
const TransformingTask = require('entoj-system').task.TransformingTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const HtmlFormatter = require('../formatter/HtmlFormatter.js').HtmlFormatter;
const VinylFile = require('vinyl');
const co = require('co');


/**
 * @memberOf task
 * @extends task.TransformingTask
 */
class BeautifyHtmlTask extends TransformingTask
{
    /**
     * @param {cli.CliLogger} cliLogger
     */
    constructor(cliLogger)
    {
        super(cliLogger);

        // Assign options
        this._formatter = new HtmlFormatter();
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'task/BeautifyHtmlTask';
    }


    /**
     * @returns {String}
     */
    get sectionName()
    {
        return 'Beautifiying HTML';
    }


    /**
     * @returns {formatter.HtmlFormatter}
     */
    get formatter()
    {
        return this._formatter;
    }


    /**
     * @returns {Stream}
     */
    processFile(file, buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function*()
        {
            /* istanbul ignore next */
            if (!file || !file.isNull)
            {
                scope.cliLogger.info('Invalid file <' + file + '>');
                return false;
            }

            // Start
            const work = scope.cliLogger.work('Processing file <' + file.path + '>');

            let resultFile;
            try
            {
                const result = yield scope.formatter.format(file.contents.toString());
                resultFile = new VinylFile(
                    {
                        path: file.path,
                        contents: new Buffer(result)
                    });
            }
            catch(error)
            {
                /* istanbul ignore next */
                ErrorHandler.error(error);
            }

            // Done
            scope.cliLogger.end(work);
            return resultFile;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.BeautifyHtmlTask = BeautifyHtmlTask;
