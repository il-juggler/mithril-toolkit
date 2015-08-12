'use strict';
module.exports = ModelManager;

var props = require('./properties');

/**
 * This is a module for managing REST_API Models
 */
function ModelManager () {
    var booleans, modelsHash;
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

    mm.api.create = function () {
        return {
            url : mm.api.prefix().concat('/', this.serviceName()),
            method : 'POST'
        };
    };

    mm.api.update = function (id) {
        return {
            
        };
    };

    mm.api['delete'] = function () {
        return {

        };
    };

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
        

        constructorFn.id = function (resource) {
            return resource[_idKey]();
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

    function createProperty (propParams) {
        return {
            create: function() {
                return m.prop;
            },
            name: propParams.name
        };
    };

    return mm;
}
