'use strict';
class BasePropTypes {
  constructor(params) {
    this.type = params;
    this.options = {
      isQuery: false,
    };
    this.resetOption.bind(this);
    this.getOption.bind(this);
    this.setOption.bind(this);
    this.isQuery = () => {
      return this.setOption('isQuery');
    };
  }
  setOption(params) {
    this.options[params] = true;
    return this;
  }
  getOption() {
    const obj = Object.assign({}, this.options);
    this.resetOption();
    return obj;
  }
  resetOption() {
    for (const key in this.options) {
      if (this.options.hasOwnProperty(key)) {
        this.options[key] = false;
      }
    }
  }
}
class EggPropTypes {
  constructor() {
    this.string = new BasePropTypes('string');
    this.number = new BasePropTypes('number');
    this.numberArray = new BasePropTypes('numberArray');
    this.stringArray = new BasePropTypes('stringArray');
  }
}
module.exports = new EggPropTypes();
