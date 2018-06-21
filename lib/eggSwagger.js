'use strict';
const fs = require('fs');
const {
    regExpUrl
} = require('./regExp');
//private 
const initTags = Symbol('eggSwagger#initTags');
const initPaths = Symbol('eggSwagger#initPaths');
const createDefinitions = Symbol('eggSwagger#createDefinitions');
const getOperationId = Symbol('eggSwagger#getOperationId');
const getParameters = Symbol('eggSwagger#getParameters');
const createSwaggerFile = Symbol('eggSwagger#createSwaggerFile');
/**
 * 注册router以及生成swagger.json
 * Todo：1.制作成一个plugin:
 * user Symbol To set a private function:Done
 */
class EggSwagger {
    constructor(routes, options) {
        this.defaultOption = {
            swagger: '2.0',
            info: {
                version: '1.0.0',
                title: 'Swagger2.0Api',
            },
            host: '127.0.0.1:7001',
            basePath: '/',
            tags: [],
            paths: {},
            definitions: {},
            tagsCaches: ['api'],
        };
        this.json = { ...this.defaultOption,
            ...options
        };
        this.routes = routes;
        this.initSwagger.bind(this);
    }
    initSwagger(app) {
        this[initPaths](app);
        this[initTags]();
        this[createSwaggerFile]();
    }
    /**根据routes 初始化swagger中的paths
     * 
     */
    [initPaths](app) {
        let routes = this.routes;
        let json = this.json;
        for (const key in routes) {
            if (routes.hasOwnProperty(key)) {
                const element = routes[key];
                //注册router
                app.router[element.method](regExpUrl(key), element.action);
                const opId = this[getOperationId](element.action);
                const params = this[getParameters](opId + 'Model', element.method, element.model, json);
                if (element.tag) {
                    json.tagsCaches = [...json.tagsCaches, element.tag];
                }
                json.paths[key] = {};
                json.paths[key][element.method] = {
                    tags: [element.tag || json.tagsCaches[0]],
                    summary: element.summary || key,
                    description: element.description || 'description is not define',
                    operationId: opId,
                    parameters: params,
                    responses: {
                        200: {
                            description: 'OK',
                        },
                    },
                };
            }
        }

    }

    /**创建Tags
     * 
     */
    [initTags]() {
        this.json.tagsCaches.forEach(element => {
            this.json.tags.push({
                name: element,
                description: element,
            });
        });
        delete this.json.tagsCaches;
    }

    /**根据Router中Action获取Swagger-operationID
     * 
     */
    [getOperationId](action) {
        const a = Object.getOwnPropertySymbols(action);
        const value = action[a[0]];
        const b = value.split('#')[1];
        const c = b.split('.')[1].replace('()', '');
        return c;
    }

    /**
     * name:模型名称
     * method:调用的方式
     * model：相关模型
     */
    [getParameters](name, method, model) {
        //存放Query中的定义
        var parameters = [];
        var bodyParameters = {};
        for (const key in model) {
            if (model.hasOwnProperty(key)) {
                if (typeof model[key] !== 'function') {
                    bodyParameters[key] = model[key];
                    continue;
                }
                const element = model[key]();
                const options = element.getOption();
                if (method.toUpperCase() === 'GET') {
                    options.isQuery = true;
                }
                if (options.isQuery) {
                    //QueryParamterHandler
                    parameters.push({ in: 'query',
                        name: key,
                        required: 'true',
                        type: options.type,
                    });
                } else {
                    //BodyParamter
                    bodyParameters[key] = element;
                }
            }
        }
        if (!isEmpty(bodyParameters)) {
            parameters.push({ in: 'body',
                name: 'data',
                required: 'true',
                schema: {
                    $ref: '#/definitions/' + name,
                },
            });
            this[createDefinitions](name, bodyParameters)
        }
        return parameters;
    }

    /**创建model
     * name：模型名称
     * model：相关模型
     */
    [createDefinitions](name, model) {
        let json = this.json;
        json.definitions[name] = {
            type: "object",
            properties: {}
        }
        //model :array/object /propType
        for (const key in model) {
            if (model.hasOwnProperty(key)) {
                const element = typeof model[key] === 'function' ? model[key]() : model[key];
                //BasePropTypes
                if (element.constructor.name === 'BasePropTypes') {
                    const obj = {};
                    switch (element.type) {
                        case 'numberArray':
                        case 'stringArray':
                            obj.type = 'array';
                            obj.items = {
                                'type': element.type.split('A')[0]
                            };
                            break;
                        default:
                            obj.type = element.type;
                            break;
                    }
                    json.definitions[name].properties[key] = obj;
                    continue;
                }
                //when typeof is Array or Obj
                if (element.constructor == Array) {
                    if (element[0].constructor.name === 'BasePropTypes') {
                        json.definitions[name].properties[key] = {
                            "type": "array",
                            "items": element[0].type
                        }
                        continue;
                    }
                    json.definitions[name].properties[key] = {
                        "type": "array",
                        "xml": {
                            "name": key,
                            "wrapped": true
                        },
                        "items": {
                            "$ref": "#/definitions/" + name + "_" + key
                        }
                    };
                    this[createDefinitions](name + "_" + key, element[0])
                } else {
                    json.definitions[name].properties[key] = {
                        "$ref": "#/definitions/" + name + "_" + key
                    }
                    this[createDefinitions](name + "_" + key, element)
                }

            }
        }
    }

    // 生成Swagger File
    [createSwaggerFile]() {
        fs.writeFileSync('./app/public/swagger.json', JSON.stringify(this.json), 'utf8', err => {
            if (err) throw err;
            console.log('The swagger file has been saved!');
        });
    }
}

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

module.exports = EggSwagger;