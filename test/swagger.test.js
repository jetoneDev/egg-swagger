'use strict';

const mock = require('egg-mock');

describe('test/swagger.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/swagger-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('swaggerTest', () => {
    const {
      createSwagger,
      eggPropTypes,
    } = app.swaggerHelper;
    const routes = {
      '/Api/test': {
        method: 'post',
        action: app.controller.user.test,
        model: {
          id: eggPropTypes.number,
        },
      },
    };
    createSwagger(routes, {});
  });
});
