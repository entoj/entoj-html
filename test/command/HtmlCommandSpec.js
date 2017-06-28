'use strict';

/**
 * Requirements
 */
const HtmlCommand = require(HTML_SOURCE + '/command/HtmlCommand.js').HtmlCommand;
const commandSpec = require('entoj-system/test').command.CommandShared;
const Filters = require('entoj-system').nunjucks.filter;
const projectFixture = require('entoj-system/test').fixture.project;
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');


/**
 * Spec
 */
describe(HtmlCommand.className, function()
{
    /**
     * Command Test
     */
    commandSpec(HtmlCommand, 'command/HtmlCommand', prepareParameters);

    // Adds necessary parameters to create a testee
    function prepareParameters(parameters)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.mappings =
            [
                {
                    type: require('entoj-system').nunjucks.Environment,
                    options:
                    {
                        basePath: '${sites}',
                    },
                    '!filters':
                    [
                        Filters.LoadFilter,
                        Filters.ImageUrlFilter,
                        Filters.ModuleClassesFilter,
                        Filters.EmptyFilter,
                        Filters.NotEmptyFilter,
                        Filters.MediaQueryFilter
                    ]
                }
            ];
            config.pathes.cacheTemplate = HTML_FIXTURES + '/temp';
            return config;
        });
        return [global.fixtures.context];
    }


    /**
     * SassCommand Test
     */
    function createTestee(buildConfiguration)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.mappings =
            [
                {
                    type: require('entoj-system').nunjucks.Environment,
                    options:
                    {
                        basePath: '${sites}',
                    },
                    '!filters':
                    [
                        Filters.LoadFilter,
                        Filters.ImageUrlFilter,
                        Filters.ModuleClassesFilter,
                        Filters.EmptyFilter,
                        Filters.NotEmptyFilter,
                        Filters.MediaQueryFilter
                    ]
                }
            ];
            config.pathes.cacheTemplate = HTML_FIXTURES + '/temp';
            config.environments.development = buildConfiguration || {};
            return config;

        });
        return new HtmlCommand(global.fixtures.context);
    }


    describe('#export()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.export();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should export all configured html files', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(HTML_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.export();
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/base/elements/e-image/e-image.html'))).to.be.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/base/modules/m-teaser/m-teaser.html'))).to.be.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/extended/elements/e-image/e-image.html'))).to.be.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/extended/modules/m-teaser/m-teaser.html'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to pass a query for entities', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(HTML_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.export({ _:['base'] });
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/base/elements/e-image/e-image.html'))).to.be.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/base/modules/m-teaser/m-teaser.html'))).to.be.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/extended/elements/e-image/e-image.html'))).to.be.not.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/html/export/extended/modules/m-teaser/m-teaser.html'))).to.be.not.ok;
            });
            return promise;
        });

        it('should allow to write html to a custom path', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(HTML_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.export({ _:['base'], destination: path.join(HTML_FIXTURES, '/temp/release') });
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/release/base/elements/e-image/e-image.html'))).to.be.ok;
                expect(yield fs.exists(path.join(HTML_FIXTURES, '/temp/release/base/modules/m-teaser/m-teaser.html'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to format files via environment settings', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(HTML_FIXTURES, '/temp'));
                const testee = createTestee({ html: { beautify: true }});
                yield testee.export();
                //@todo need to find a smart way to test beautify without testing the beautifier....
                //const filename = path.join(HTML_FIXTURES, '/temp/html/export/base/modules/m-teaser/m-teaser.html');
                //const contents = yield fs.readFile(filename, { encoding: 'utf8' });
                //expect(yield fs.readFile(filename, { encoding: 'utf8' })).to.not.contain('');
            });
            return promise;
        });
    });
});
