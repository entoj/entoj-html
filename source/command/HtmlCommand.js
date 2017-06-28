'use strict';

/**
 * Requirements
 * @ignore
 */
const Command = require('entoj-system').command.Command;
const CliLogger = require('entoj-system').cli.CliLogger;
const Context = require('entoj-system').application.Context;
const HtmlConfiguration = require('../configuration/HtmlConfiguration.js').HtmlConfiguration;
const ExportHtmlTask = require('../task/ExportHtmlTask.js').ExportHtmlTask;
const BeautifyHtmlTask = require('../task/BeautifyHtmlTask.js').BeautifyHtmlTask;
const WriteFilesTask = require('entoj-system').task.WriteFilesTask;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const co = require('co');


/**
 * @memberOf command
 */
class HtmlCommand extends Command
{
    /**
     *
     */
    constructor(context)
    {
        super(context);

        // Assign options
        this.name = 'html';
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [Context] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'command/HtmlCommand';
    }


    /**
     * @inheritDocs
     */
    get help()
    {
        const help =
        {
            name: this._name,
            description: 'Genrates HTML files for modules',
            actions:
            [
                {
                    name: 'export',
                    description: 'Exports templates as html',
                    options:
                    [
                        {
                            name: 'query',
                            type: 'inline',
                            optional: true,
                            defaultValue: '*',
                            description: 'Query for sites to use e.g. /base'
                        },
                        {
                            name: 'destination',
                            type: 'named',
                            value: 'path',
                            optional: true,
                            defaultValue: '',
                            description: 'Define a base folder where html files are written to'
                        }
                    ]
                },
            ]
        };
        return help;
    }


    /**
     * @inheritDocs
     * @returns {Promise<Server>}
     */
    export(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.html.export');
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const htmlConfiguration = scope.context.di.create(HtmlConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            const options =
            {
                query: parameters && parameters._ && parameters._[0] || '*',
                writePath: yield pathesConfiguration.resolve((parameters && parameters.destination) || htmlConfiguration.exportPath)
            };
            let task = scope.context.di.create(ExportHtmlTask, mapping);
            if (buildConfiguration.get('html.beautify', false) === true)
            {
                task = task.pipe(scope.context.di.create(BeautifyHtmlTask, mapping));
            }
            task = task.pipe(scope.context.di.create(WriteFilesTask, mapping));
            yield task.run(buildConfiguration, options);
        });
        return promise;
    }


    /**
     * @inheritDocs
     */
    dispatch(action, parameters)
    {
        return this.export(parameters);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.HtmlCommand = HtmlCommand;
