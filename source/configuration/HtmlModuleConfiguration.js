'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const SystemModuleConfiguration = require('entoj-system').configuration.SystemModuleConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const trimSlashesLeft = require('entoj-system').utils.string.trimSlashesLeft;
const templateString = require('es6-template-strings');
const path = require('path');


/**
 * @memberOf configuration
 */
class HtmlModuleConfiguration extends Base
{
    /**
     * @param  {configuration.SystemModuleConfiguration} systemModuleConfiguration
     * @param  {model.configuration.GlobalConfiguration} globalConfiguration
     * @param  {model.configuration.BuildConfiguration} buildConfiguration
     */
    constructor(systemModuleConfiguration, globalConfiguration, buildConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'systemModuleConfiguration', systemModuleConfiguration, true, SystemModuleConfiguration);
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);
        assertParameter(this, 'buildConfiguration', buildConfiguration, true, BuildConfiguration);

        // Create configuration
        this._systemModuleConfiguration = systemModuleConfiguration;
        this._exportPath = globalConfiguration.get('html.exportPath', '${cache}/html/export');
        this._filePathTemplate = buildConfiguration.get('html.filePathTemplate', globalConfiguration.get('html.filePathTemplate', '${entity.pathString}'));
        this._fileNameTemplate = buildConfiguration.get('html.fileNameTemplate', globalConfiguration.get('html.fileNameTemplate', '${entity.idString}'));
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [SystemModuleConfiguration, GlobalConfiguration, BuildConfiguration] };
    }


    /**
     * @inheritDocss
     */
    static get className()
    {
        return 'configuration/HtmlModuleConfiguration';
    }


    /**
     * Path to a folder where compiled sass bundles are stored
     *
     * @type {String}
     */
    get exportPath()
    {
        return this._exportPath;
    }


    /**
     * @type {String}
     */
    get filePathTemplate()
    {
        return this._filePathTemplate;
    }


    /**
     * @type {String}
     */
    get fileNameTemplate()
    {
        return this._fileNameTemplate;
    }


    /**
     * @type {Array}
     */
    get languages()
    {
        return this._systemModuleConfiguration.languages;
    }


    /**
     * @type {String}
     */
    get language()
    {
        return this._systemModuleConfiguration.language;
    }


    /**
     * @type {String}
     */
    getFilenameForEntity(entity, language, settings)
    {
        const entitySettings = settings
            ? settings
            : entity.properties.getByPath('export.static', [{}]).pop();
        settings = settings || {};
        const country = language
            ? this.language.split('_').pop()
            : language.split('_').pop();
        const filePathTemplate = typeof entitySettings.filePathTemplate != 'string'
            ? this.filePathTemplate
            : settings.filePathTemplate;
        const filepath = templateString(filePathTemplate,
            {
                entity: entity,
                entityId: entity.id,
                site: entity.id.site,
                entityCategory: entity.id.category,
                language,
                country
            });
        let result = templateString(entitySettings.filename || this.fileNameTemplate,
            {
                entity: entity,
                entityId: entity.id,
                site: entity.id.site,
                entityCategory: entity.id.category,
                language,
                country
            });
        // Add entity path if necessary
        if (result.indexOf('/') == '-1' && result.indexOf('\\') == '-1')
        {
            result = trimSlashesLeft(path.join(filepath, result));
        }
        // Add .html if necessary
        if (!result.endsWith('.html'))
        {
            result+= '.html';
        }
        return result;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.HtmlModuleConfiguration = HtmlModuleConfiguration;
