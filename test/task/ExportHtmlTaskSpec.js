'use strict';

/**
 * Requirements
 */
const ExportHtmlTask = require(HTML_SOURCE + '/task/ExportHtmlTask.js').ExportHtmlTask;
const HtmlModuleConfiguration = require(HTML_SOURCE + '/configuration/HtmlModuleConfiguration.js').HtmlModuleConfiguration;
const Environment = require('entoj-system').nunjucks.Environment;
const Filters = require('entoj-system').nunjucks.filter;
const projectFixture = require('entoj-system/test').fixture.project;
const taskSpec = require('entoj-system/test').task.TaskShared;
const entitiesTaskSpec = require('entoj-system/test').task.EntitiesTaskShared;
const pathes = require('entoj-system').utils.pathes;
const co = require('co');
const VinylFile = require('vinyl');


/**
 * Spec
 */
describe(ExportHtmlTask.className, function()
{
    /**
     * BaseTask Test
     */
    entitiesTaskSpec(ExportHtmlTask, 'task/ExportHtmlTask', prepareParameters);

    /**
     */
    function prepareParameters(parameters)
    {
        parameters.unshift(global.fixtures.nunjucks);
        parameters.unshift(new HtmlModuleConfiguration(global.fixtures.systemConfiguration, global.fixtures.globalConfiguration));
        parameters.unshift(global.fixtures.urlsConfiguration);
        parameters.unshift(global.fixtures.pathesConfiguration);
        parameters.unshift(global.fixtures.globalRepository);
        parameters.unshift(global.fixtures.cliLogger);
        return parameters;
    }


    /**
     * ExportHtmlTask Test
     */
    beforeEach(function()
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.mappings =
            [
                {
                    type: require('entoj-system').nunjucks.Environment,
                    options:
                    {
                        templatePaths: '${sites}',
                    },
                    '!filters':
                    [
                        Filters.LoadFilter,
                        {
                            type: Filters.Filter,
                            options:
                            {
                                name: 'imageUrl'
                            }
                        },
                        Filters.ModuleClassesFilter,
                        Filters.EmptyFilter,
                        Filters.NotEmptyFilter,
                        Filters.MediaQueryFilter
                    ]
                }
            ];
            return config;
        });
        global.fixtures.nunjucks = global.fixtures.context.di.create(Environment);
    });

    // creates a initialized testee
    const createTestee = function()
    {
        let parameters = Array.from(arguments);
        if (prepareParameters)
        {
            parameters = prepareParameters(parameters);
        }
        return new ExportHtmlTask(...parameters);
    };


    describe('#renderEntity()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.renderEntity();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should yield a rendered html VinylFile', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const files = yield testee.renderEntity(entities[0]);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('<div class="m-teaser');
            });
            return promise;
        });

        it('should allow to render macros', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const settings =
                {
                    macro: 'm_teaser_hero'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('m-teaser--hero');
            });
            return promise;
        });

        it('should allow to configure macro parameters for rendering', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const settings =
                {
                    parameters:
                    {
                        classes: 'm-foo--teaser'
                    }
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('m-foo--teaser');
            });
            return promise;
        });

        it('should allow to render extended macros', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('extended/elements/e-image');
                const settings =
                {
                    macro: 'e_image'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('class="e-image');
            });
            return promise;
        });

        it('should allow to render pages', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/pages/p-start');
                const settings =
                {
                    type: 'page'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('All Contents');
            });
            return promise;
        });

        it('should allow to render extended pages', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('extended/pages/p-start');
                const settings =
                {
                    type: 'page'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('All Contents');
            });
            return promise;
        });

        it('should allow to render templates', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/templates/t-bare');
                const settings =
                {
                    type: 'template'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('t-bare__viewport');
            });
            return promise;
        });

        it('should allow to render extended templates', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('extended/templates/t-bare');
                const settings =
                {
                    type: 'template'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file).to.be.instanceof(VinylFile);
                expect(file.contents.toString()).to.contain('t-bare__viewport');
            });
            return promise;
        });

        it('should auto generate a filename based on the entity path', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const files = yield testee.renderEntity(entities[0]);
                const file = files[0];
                expect(file.path).to.be.equal(pathes.normalizePathSeparators('base/modules/m-teaser/m-teaser.html'));
            });
            return promise;
        });

        it('should allow to specify a complete filename via settings', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const settings =
                {
                    filename: 'foo/bars.html'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file.path).to.be.equal(pathes.normalizePathSeparators('foo/bars.html'));
            });
            return promise;
        });

        it('should allow to specify a partial filename via settings', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const settings =
                {
                    filename: 'bars'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file.path).to.be.equal(pathes.normalizePathSeparators('base/modules/m-teaser/bars.html'));
            });
            return promise;
        });

        it('should allow to specify a filename with variables via settings', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const settings =
                {
                    filename: '${entity.idString}-foo'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                const file = files[0];
                expect(file.path).to.be.equal(pathes.normalizePathSeparators('base/modules/m-teaser/m-teaser-foo.html'));
            });
            return promise;
        });

        it('should render each entity for each configured language', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                global.fixtures.systemConfiguration._languages = ['en_GB', 'de_DE'];
                const entities = yield global.fixtures.globalRepository.resolveEntities('base/modules/m-teaser');
                const settings =
                {
                    filename: '${entity.idString}-${language}'
                };
                const files = yield testee.renderEntity(entities[0], settings);
                expect(files).to.have.length(2);
                expect(files[0].path).to.be.equal(pathes.normalizePathSeparators('base/modules/m-teaser/m-teaser-en_GB.html'));
                expect(files[1].path).to.be.equal(pathes.normalizePathSeparators('base/modules/m-teaser/m-teaser-de_DE.html'));
            });
            return promise;
        });
    });


    describe('#stream()', function()
    {
        it('should stream all compiled html files', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield taskSpec.readStream(testee.stream());
                expect(files).to.have.length(4);
                for (const file of files)
                {
                    expect(file.path).to.be.oneOf(
                        [
                            pathes.normalizePathSeparators('base/modules/m-teaser/m-teaser.html'),
                            pathes.normalizePathSeparators('extended/modules/m-teaser/m-teaser.html'),
                            pathes.normalizePathSeparators('base/elements/e-image/e-image.html'),
                            pathes.normalizePathSeparators('extended/elements/e-image/e-image.html')
                        ]);
                }
            });
            return promise;
        });

        it('should allow to configure the file path', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield taskSpec.readStream(testee.stream(undefined, undefined, { filepathTemplate: 'foo' }));
                expect(files).to.have.length(4);
                for (const file of files)
                {
                    expect(file.path).to.be.oneOf(
                        [
                            pathes.normalizePathSeparators('foo/m-teaser.html'),
                            pathes.normalizePathSeparators('foo/e-image.html')
                        ]);
                }
            });
            return promise;
        });

        it('should allow to remove the file path', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield taskSpec.readStream(testee.stream(undefined, undefined, { filepathTemplate: '' }));
                expect(files).to.have.length(4);
                for (const file of files)
                {
                    expect(file.path).to.be.oneOf(
                        [
                            pathes.normalizePathSeparators('m-teaser.html'),
                            pathes.normalizePathSeparators('e-image.html')
                        ]);
                }
            });
            return promise;
        });
    });
});
