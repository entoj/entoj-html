'use strict';

/**
 * Requirements
 * @ignore
 */
const BaseMap = require('entoj-system').base.BaseMap;
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
const HtmlModuleConfiguration = require('../configuration/HtmlModuleConfiguration.js').HtmlModuleConfiguration;
const VinylFile = require('vinyl');
const co = require('co');


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
    constructor(cliLogger, globalRepository, pathesConfiguration, urlsConfiguration, htmlModuleConfiguration, nunjucks)
    {
        super(cliLogger, globalRepository);

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'urlsConfiguration', urlsConfiguration, true, UrlsConfiguration);
        assertParameter(this, 'htmlModuleConfiguration', htmlModuleConfiguration, true, HtmlModuleConfiguration);
        assertParameter(this, 'nunjucks', nunjucks, true, Environment);

        // Assign options
        this._pathesConfiguration = pathesConfiguration;
        this._urlsConfiguration = urlsConfiguration;
        this._htmlModuleConfiguration = htmlModuleConfiguration;
        this._nunjucks = nunjucks;

        // Configure nunjucks path
        this._nunjucks.path = this._pathesConfiguration.sites;
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, GlobalRepository, PathesConfiguration, UrlsConfiguration, HtmlModuleConfiguration, Environment] };
    }


    /**
     * @inheritDoc
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
     * @inheritDoc
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
    }


    /**
     * @inheritDoc
     */
    get urlsConfiguration()
    {
        return this._urlsConfiguration;
    }


    /**
     * @inheritDoc
     */
    get htmlModuleConfiguration()
    {
        return this._htmlModuleConfiguration;
    }

    /**
     * @inheritDocs
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const promise = super.prepareParameters(buildConfiguration, parameters)
            .then((params) =>
            {
                params.filterCallbacks = params.filterCallbacks
                    ? params.filterCallbacks
                    : {};
                params.exportName = params.exportName
                    ? params.exportName
                    : 'html';
                return params;
            });
        return promise;
    }


    /**
     * @returns {Promise<VinylFile>}
     */
    renderFile(filename, entity, entitySettings, buildConfiguration, parameters, templateConfiguration)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const settings = entitySettings || {};
            const params = yield scope.prepareParameters(buildConfiguration, parameters);
            const macroName = settings.macro || entity.idString.lodasherize();
            const macroParameters = settings.parameters || settings.arguments || {};
            const entityPath = entity.pathString + '/' + entity.idString;
            const type = settings.type || entity.id.category.type;

            // Create template
            let template = '';
            switch(type)
            {
                case 'template':
                    const extend = yield scope.urlsConfiguration.matchEntityFile(entityPath + '.j2');
                    if (extend && extend.file)
                    {
                        const extendsPath = extend.file.filename.replace(scope.pathesConfiguration.sites, '');
                        template+= '{% extends "' + normalizePathSeparators(trimSlashesLeft(extendsPath)) + '" %}\n';
                    }
                    break;

                case 'page':
                case 'include':
                    const include = yield scope.urlsConfiguration.matchEntityFile(entityPath + '.j2');
                    if (include && include.file)
                    {
                        const includePath = include.file.filename.replace(scope.pathesConfiguration.sites, '');
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
            scope.nunjucks.addGlobal('__configuration__', new BaseMap(templateConfiguration));
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
            const result = [];
            const settings = entitySettings || {};

            // Render each language
            for (const language of scope.htmlModuleConfiguration.languages)
            {
                const filename = scope.htmlModuleConfiguration.getFilenameForEntity(entity, language, settings);
                const templateConfiguration = settings.configuration || {};
                templateConfiguration.language = language;
                result.push(yield scope.renderFile(filename, entity, entitySettings, buildConfiguration, parameters, templateConfiguration));
            }

            return result;
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
            const params = yield scope.prepareParameters(buildConfiguration, parameters);
            const result = [];
            const settings = entity.properties.getByPath('export.' + params.exportName, []);
            for (const setting of settings)
            {
                // Render entity
                const files = yield scope.renderEntity(entity, setting, buildConfiguration, parameters);
                if (files)
                {
                    result.push(...files);
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
