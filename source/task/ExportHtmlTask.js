'use strict';

/**
 * Requirements
 * @ignore
 */
const EntitiesTask = require('entoj-system').task.EntitiesTask;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const GlobalRepository = require('entoj-system').model.GlobalRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const UrlsConfiguration = require('entoj-system').model.configuration.UrlsConfiguration;
const Environment = require('entoj-system').nunjucks.Environment;
const CliLogger = require('entoj-system').cli.CliLogger;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const trimSlashesLeft = require('entoj-system').utils.string.trimSlashesLeft;
const normalizePathSeparators = require('entoj-system').utils.urls.normalizePathSeparators;
const templateString = require('es6-template-strings');
const VinylFile = require('vinyl');
const co = require('co');
const path = require('path');


/**
 * Parameters:
 *     query - Restricts the source entities to the given query (see GlobalRepository.resolve)
 *
 * Properties:
 *     release.html
 *         filename
 *         macro
 *         type
 *
 * @memberOf task
 */
class ExportHtmlTask extends EntitiesTask
{
    /**
     *
     */
    constructor(cliLogger, globalRepository, pathesConfiguration, urlsConfiguration, nunjucks)
    {
        super(cliLogger, globalRepository);

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'urlsConfiguration', urlsConfiguration, true, UrlsConfiguration);
        assertParameter(this, 'nunjucks', nunjucks, true, Environment);

        // Assign options
        this._pathesConfiguration = pathesConfiguration;
        this._urlsConfiguration = urlsConfiguration;
        this._nunjucks = nunjucks;

        // Configure nunjucks path
        this._nunjucks.path = this._pathesConfiguration.sites;
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, GlobalRepository, PathesConfiguration, UrlsConfiguration, Environment] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'task/ExportHtmlTask';
    }


    /**
     * @inheritDoc
     */
    get nunjucks()
    {
        return this._nunjucks;
    }


    /**
     * @inheritDocs
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const promise = super.prepareParameters(buildConfiguration, parameters)
            .then((params) =>
            {
                params.filepathTemplate = typeof params.filepathTemplate === 'string'
                    ? params.filepathTemplate
                    : '${entity.pathString}';
                params.filterCallbacks = params.filterCallbacks
                    ? params.filterCallbacks
                    : {};
                return params;
            });
        return promise;
    }


    /**
     * @returns {Promise<VinylFile>}
     */
    renderEntity(entity, entitySettings, buildConfiguration, parameters)
    {
        if (!entity)
        {
            this.logger.warn(this.className + '::renderEntity - No entity given');
            return Promise.resolve(false);
        }

        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const settings = entitySettings || {};
            const params = yield scope.prepareParameters(buildConfiguration, parameters);
            const macroName = settings.macro || entity.idString.lodasherize();
            const macroParameters = settings.parameters || {};
            const filepath = templateString(params.filepathTemplate,
                {
                    entity: entity,
                    entityId: entity.id,
                    site: entity.id.site,
                    entityCategory: entity.id.category
                });
            const entityPath = entity.pathString + '/' + entity.idString;

            // Generate filename
            let filename;
            if (settings.filename)
            {
                filename = settings.filename;

                // Add entity path if necessary
                if (filename.indexOf('/') == '-1' && filename.indexOf('\\') == '-1')
                {
                    filename = trimSlashesLeft(path.join(filepath, filename));
                }

                // Add .html if necessary
                if (!filename.endsWith('.html'))
                {
                    filename+= '.html';
                }
            }
            else
            {
                filename = trimSlashesLeft(path.join(filepath, entity.idString + '.html'));
            }

            // Create template
            let template = '';
            switch(settings.type)
            {
                case 'template':
                    const extend = yield scope._urlsConfiguration.matchEntityFile(entityPath + '.j2');
                    if (extend && extend.file)
                    {
                        const extendsPath = extend.file.filename.replace(scope._pathesConfiguration.sites, '');
                        template+= '{% extends "' + normalizePathSeparators(trimSlashesLeft(extendsPath)) + '" %}\n';
                    }
                    break;

                case 'page':
                case 'include':
                    const include = yield scope._urlsConfiguration.matchEntityFile(entityPath + '.j2');
                    if (include && include.file)
                    {
                        const includePath = include.file.filename.replace(scope._pathesConfiguration.sites, '');
                        template+= '{% include "' + normalizePathSeparators(trimSlashesLeft(includePath)) + '" %}\n';
                    }
                    break;

                default:
                    template+= '{{ ' + macroName + '(';
                    const renderedParameters = [];
                    for (const key in macroParameters)
                    {
                        let value = macroParameters[key];
                        if (typeof value == 'string')
                        {
                            value = '\'' + value + '\'';
                        }
                        renderedParameters.push(key + '=' + value);
                    }
                    template+= renderedParameters.join(', ') + ') }}';
                    break;
            }

            // Compile
            const work = scope.cliLogger.work('Rendering template to html for <' + entity.idString + '> as <' + filename + '>');
            const data =
            {
                site: entity.site,
                entity: entity
            };
            const location =
            {
                site: data.site,
                entity: data.entity,
                customPath: ''
            };
            scope.nunjucks.addGlobal('global', {});
            scope.nunjucks.addGlobal('location', location);
            scope.nunjucks.addGlobal('request', false);
            scope.nunjucks.clearFilterCallbacks();
            for (const filterName in params.filterCallbacks)
            {
                scope.nunjucks.addFilterCallback(filterName, params.filterCallbacks[filterName]);
            }
            const contents = scope._nunjucks.renderString(template, data);
            scope.cliLogger.end(work);

            // Done
            const file = new VinylFile(
                {
                    path: filename,
                    contents: new Buffer(contents)
                });
            return file;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * @returns {Promise<Array<VinylFile>>}
     */
    processEntity(entity, buildConfiguration, parameters)
    {
        /* istanbul ignore next */
        if (!entity)
        {
            this.logger.warn(this.className + '::processEntity - No entity given');
            return Promise.resolve(false);
        }

        const scope = this;
        const promise = co(function *()
        {
            // Render each configured release
            const result = [];
            const settings = entity.properties.getByPath('export.html', []);
            for (const setting of settings)
            {
                // Render entity
                const file = yield scope.renderEntity(entity, setting, buildConfiguration, parameters);
                if (file)
                {
                    result.push(file);
                }
            }

            // Done
            return result;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.ExportHtmlTask = ExportHtmlTask;
