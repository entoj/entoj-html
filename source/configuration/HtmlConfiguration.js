'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * @memberOf configuration
 */
class HtmlConfiguration extends Base
{
    /**
     * @param  {model.configuration.GlobalConfiguration} globalConfiguration
     */
    constructor(globalConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);

        // Create configuration
        this._exportPath = globalConfiguration.get('html.exportPath', '${cache}/html/export');
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [GlobalConfiguration] };
    }


    /**
     * @inheritDocss
     */
    static get className()
    {
        return 'configuration/HtmlConfiguration';
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
}


/**
 * Exports
 * @ignore
 */
module.exports.HtmlConfiguration = HtmlConfiguration;
