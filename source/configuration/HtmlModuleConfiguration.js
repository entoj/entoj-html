'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const SystemModuleConfiguration = require('entoj-system').configuration.SystemModuleConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * @memberOf configuration
 */
class HtmlModuleConfiguration extends Base
{
    /**
     * @param  {model.configuration.GlobalConfiguration} globalConfiguration
     */
    constructor(systemModuleConfiguration, globalConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);
        assertParameter(this, 'systemModuleConfiguration', systemModuleConfiguration, true, SystemModuleConfiguration);

        // Create configuration
        this._systemModuleConfiguration = systemModuleConfiguration;
        this._exportPath = globalConfiguration.get('html.exportPath', '${cache}/html/export');
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [SystemModuleConfiguration, GlobalConfiguration] };
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
}


/**
 * Exports
 * @ignore
 */
module.exports.HtmlModuleConfiguration = HtmlModuleConfiguration;
