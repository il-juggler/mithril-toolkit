'use strict';

var booleans, createModel, createProperty, modelsHash;
modelsHash = {};

function mm (modelName, constructorFn) {
    if (arguments.length === 1) {
        return modelsHash[modelName];
    }
    modelsHash[modelName] = createModel(modelName, constructorFn);
    return modelsHash[modelName];
};

mm.apiPrefix = m.prop('/api/');

mm.props = {};

mm.props.string = function(params) {
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

mm.props.number = function(params) {
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

mm.props.boolean = function(params) {
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

createModel = function(modelName, constructorFn) {
    var _idKey, _serviceName, addProp, defaultGetUrl, getUrl, props;
    props = {};
    _serviceName = modelName;
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
    defaultGetUrl = function(urlType, id) {
        var url, urlParams;
        url = mm.apiPrefix().concat(_serviceName);

        urlParams = {
            
        };
        if (urlType === 'id') {
            url += '/get/'.concat(id);
        } else if(urlType === 'create') {
            url += '/create';
        } 

        return url.concat(m.route.buildQueryString(urlParams));
    };
    constructorFn.modelName = function() {
        return modelName;
    };
    constructorFn.serviceName = function(i) {
        if (arguments.length > 0) {
            _serviceName = i;
            return constructorFn;
        }
        return _serviceName;
    };
    constructorFn.idKey = function(i) {
        if (arguments.length > 0) {
            _idKey = i;
            return constructorFn;
        }
        return _idKey;
    };

    /*
         Property creator
     */
    constructorFn.prop = function(propName, propParams) {
        propParams.name = propName;
        props[propName] = createProperty(propParams);
        return this;
    };

    constructorFn.method = function(methodName, methodFn) {
        constructorFn.prototype[methodName] = methodFn;
        return constructorFn;
    };

    constructorFn.initializeInstance = function(data) {
        data || (data = {});
        Object.keys(props).forEach(addProp.bind(this, data));
        return this;
    };

    addProp = function(data, key) {
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

