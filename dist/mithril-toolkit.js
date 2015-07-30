(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    prop : require('./src/properties.js'),
    ModelManager : require('./src/ModelManager.js')
};
},{"./src/ModelManager.js":3,"./src/properties.js":4}],2:[function(require,module,exports){
window.mtk = require('./index.js');
},{"./index.js":1}],3:[function(require,module,exports){
'use strict';
module.exports = ModelManager;

var props = require('./properties');

/**
 * This is a module for managing REST_API Models
 */
function ModelManager () {
    var booleans, createProperty, modelsHash;
    modelsHash = {}; 

    //Api prefix for the web services
    mm.apiPrefix  = m.prop('/api/');
    mm.properties = props;

    /** 
     * Accesor for the ModelsManager
     */
    function mm (modelName, constructorFn) {
        if (arguments.length === 1) {
            return modelsHash[modelName];
        }
        modelsHash[modelName] = createModel(modelName, constructorFn);
        return modelsHash[modelName];
    };

    /** 
     * Function that constructs a model from a Name and a constructor function
     */
    function createModel (modelName, constructorFn) {
        var _idKey, _serviceName, addProp, defaultGetUrl, getUrl, props;
        //Pull for the properties
        props = {};
        //Name of the service to work with the api
        _serviceName = modelName;
        //Property key of the identifier property
        _idKey = 'id';
        var internalGetUrl;

        /*
        Construct the Url of the model
         */
        getUrl = function(type, id) {
            if (internalGetUrl) {
                return internalGetUrl(type, id);
            } else {
                return defaultGetUrl(type, id);
            }
        };

        /** 
         * The url for the services
         */
        defaultGetUrl = function(urlType, id) {
            var url, urlParams;
            
            url = mm.apiPrefix().concat(_serviceName);
            urlParams = {};

            if (urlType === 'id') {
                url += '/get/'.concat(id);
            } else if(urlType === 'create') {
                url += '/create';
            } 

            return url.concat(m.route.buildQueryString(urlParams));
        };

        //ModelName getter
        constructorFn.modelName = function() {
            return modelName;
        };

        //ModelName getter/setter
        constructorFn.serviceName = function(i) {
            if (arguments.length > 0) {
                _serviceName = i;
                return constructorFn;
            }
            return _serviceName;
        };

        //IdKey getter/setter
        constructorFn.idKey = function(i) {
            if (arguments.length > 0) {
                _idKey = i;
                return constructorFn;
            }
            return _idKey;
        };

        /**
         * Creates a Property
         */
        constructorFn.prop = function(propName, propParams) {
            propParams.name = propName;
            props[propName] = createProperty(propParams);
            return this;
        };

        /** 
         * Creates a Method
         */
        constructorFn.method = function(methodName, methodFn) {
            constructorFn.prototype[methodName] = methodFn;
            return constructorFn;
        };

        /** 
         * Initialize a new instance by copy the data hash to model properties
         */
        constructorFn.initializeInstance = function(data) {
            data || (data = {});
            Object.keys(props).forEach(addProp.bind(this, data));
            return this;
        };

        //
        function addProp(data, key) {
            return this[props[key].name] = m.prop(data[props[key].name] || null);
        };

        constructorFn.save = function(resource) {
            return m.request({
                method: 'POST',
                url: getUrl('create'),
                data : resource
            });
        };

        constructorFn.get = function(id, extraArgs) {
            return m.request(_.extend({
                method: 'GET',
                url: getUrl('id', id),
                unwrapSuccess: function (r) { 
                    return new constructorFn(r.data); 
                }
            },extraArgs));
        };

        constructorFn.find = function (iQuery) {
            return m.request({
                method : 'GET',
                url : getUrl('find', iQuery),
                unwrapSuccess : function (r) {
                    return r.data.map(function (item) { 
                        return new constructorFn(item); 
                    });
                }
            });
        };

        return constructorFn;
    };

    createProperty = function(propParams) {
        return {
            create: function() {
                return m.prop;
            },
            name: propParams.name
        };
    };


    return mm;
}

},{"./properties":4}],4:[function(require,module,exports){
var properties = {};
module.exports = properties;

properties.string = function(params) {
    var internal, prop, set, validate;
    internal = m.prop();

    set = function (val) {
        internal(val);
        return validate();
    };

    validate = function () {
        var valid;
        valid = params.match ? internal().match(params.match) : true;
        return prop.valid(valid ? true : false);
    };

    prop = function () {
        if (arguments.length) {
            return set(arguments[0]);
        } else {
            return internal();
        }
    };

    prop.valid = m.prop();
    return prop;
};

properties.number = function(params) {
    var prop;
    prop = m.prop();
    return prop;
};

booleans = {
    'true': true,
    '1': true,
    '0': false,
    'false': false,
    'on': true,
    'off': true,
    'null': false
};

properties.boolean = function(params) {
    var internal, prop, set;
    internal = m.prop();
    prop = function() {
        if (arguments.length) {
            return set(arguments[0]);
        } else {
            return internal();
        }
    };
    return set = function(val) {
        if (typeof val === 'undefined') {
            return internal(void 0);
        }
        if (typeof booleans[String(val)] === 'undefined') {
            return internal(void 0);
        }
        return internal(booleans[String(val)]);
    };
};

},{}]},{},[2]);
