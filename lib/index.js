'use strict';
const EggSwagger = require('./eggSwagger');
const EggPropTypes = require('./eggPropTypes');
module.exports = app => {
  app.swaggerHelper = {
    createSwagger: (routes, options) => {
      new EggSwagger(routes, options).initSwagger(app);
    },
    eggPropTypes: EggPropTypes,
  };
};
