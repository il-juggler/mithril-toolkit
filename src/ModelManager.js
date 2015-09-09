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
    mm.api = {};
    mm.api.prefix = m.prop('/api');

    mm.api.get = function (id) {
        return {
            url : mm.api.prefix().concat('/', this.serviceName(), '/', id),
            method : 'GET'
        };
    };

    mm.api.create = function (data) {
        return {
            url : mm.api.prefix().concat('/', this.serviceName()),
            method : 'POST',
            data : data
        };
    };

    mm.api.update = function (id, data) {
        return {
            url : mm.api.prefix().concat('/', this.serviceName(), '/', id),
            method : 'PUT',
            data : data
        }
    };

    mm.api.find = function (search) {
        return {
            url : mm.api.prefix().concat('/', this.serviceName()),
            method : 'GET',
            data : search || {}
        }
    };

    mm.api['delete'] = function (id) {
        return {
            url : mm.api.prefix().concat('/', this.serviceName(), '/', id),
            method : 'DELETE'
        }
    };

    mm.properties = props;

    /** 
     * Accesor for the ModelsManager
     *
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
     *
     */
    function createModel (modelName, constructorFn) {
        var _idKey, _serviceName, addProp, props;
        //Pull for the properties
        props = {};
        //Name of the service to work with the api
        _serviceName = modelName;
        //Property key of the identifier property
        _idKey = 'id';
        var internalGetUrl;

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



        constructorFn.prototype.toJSON = function() {
            var json = {};
            var self = this;

            Object.keys(props).forEach(function (k) {
                if(k.indexOf('$') == 0) return;

                if(typeof self[k].toJSON === 'function') {
                    json[k] = self[k].toJSON()
                } else {
                    json[k] = self[k]();
                }
            });

            return json;
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
        

        constructorFn.id = function (resource) {
            return resource[_idKey].call();
        };

        constructorFn.save = function(resource) {
            var qParams = _.extend({}, mm.api.create.call(constructorFn, resource));
            return m.request(qParams);
        };

        constructorFn.get = function(id, extraArgs) {
            var qParams = _.extend({
                unwrapSuccess : function (r) { 
                    return new constructorFn( r.data ); 
                }
            }, mm.api.get.call(constructorFn,id), extraArgs);

            return m.request(qParams);
        };

        constructorFn.find = function (iQuery, extraArgs) {
            var qParams = _.extend({
                unwrapSuccess : function (r) {
                    return r.data.map(function (item) { 
                        return new constructorFn(item); 
                    });
                }
            },mm.api.find.call(constructorFn, iQuery), extraArgs);

            console.log(qParams);

            return m.request(qParams);
              
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
