(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.mtk = require('./index.js');
},{"./index.js":2}],2:[function(require,module,exports){
module.exports = {
    prop : require('./src/properties.js'),
    ModelManager : require('./src/ModelManager.js'),
    vmFactory : require('./src/vmFactory.js'),
    notify : require('./src/notify.js')
};
},{"./src/ModelManager.js":3,"./src/notify.js":4,"./src/properties.js":5,"./src/vmFactory.js":6}],3:[function(require,module,exports){
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

},{"./properties":5}],4:[function(require,module,exports){
module.exports = notify;

function notify (status, text) {
    if(arguments.length < 2) {
        text  = status;
        status = 'success' 
    }
    var notif = $('<div class="global-notification">' + '<div class="alert alert-' + status + '">' + text + '</div></div>');
    
    notif.appendTo($('body'));
    
    setTimeout(function () {
        notif.remove();
    },2000)
};

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
module.exports = vmFactory;

function vmFactory (params) {
    var map = {};
    return function (reference) {
        var key = params.key(reference);
        map[key] || (map[key] = params.create(reference));
        return map[key];
    }
}
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbHNvbC9wcm9qZWN0cy9pbnp1cnJla3QvbWl0aHJpbC10b29sa2l0L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9hbHNvbC9wcm9qZWN0cy9pbnp1cnJla3QvbWl0aHJpbC10b29sa2l0L2Zha2VfZGUyZWRkZTAuanMiLCIvVXNlcnMvYWxzb2wvcHJvamVjdHMvaW56dXJyZWt0L21pdGhyaWwtdG9vbGtpdC9pbmRleC5qcyIsIi9Vc2Vycy9hbHNvbC9wcm9qZWN0cy9pbnp1cnJla3QvbWl0aHJpbC10b29sa2l0L3NyYy9Nb2RlbE1hbmFnZXIuanMiLCIvVXNlcnMvYWxzb2wvcHJvamVjdHMvaW56dXJyZWt0L21pdGhyaWwtdG9vbGtpdC9zcmMvbm90aWZ5LmpzIiwiL1VzZXJzL2Fsc29sL3Byb2plY3RzL2luenVycmVrdC9taXRocmlsLXRvb2xraXQvc3JjL3Byb3BlcnRpZXMuanMiLCIvVXNlcnMvYWxzb2wvcHJvamVjdHMvaW56dXJyZWt0L21pdGhyaWwtdG9vbGtpdC9zcmMvdm1GYWN0b3J5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIndpbmRvdy5tdGsgPSByZXF1aXJlKCcuL2luZGV4LmpzJyk7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcHJvcCA6IHJlcXVpcmUoJy4vc3JjL3Byb3BlcnRpZXMuanMnKSxcbiAgICBNb2RlbE1hbmFnZXIgOiByZXF1aXJlKCcuL3NyYy9Nb2RlbE1hbmFnZXIuanMnKSxcbiAgICB2bUZhY3RvcnkgOiByZXF1aXJlKCcuL3NyYy92bUZhY3RvcnkuanMnKSxcbiAgICBub3RpZnkgOiByZXF1aXJlKCcuL3NyYy9ub3RpZnkuanMnKVxufTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsTWFuYWdlcjtcblxudmFyIHByb3BzID0gcmVxdWlyZSgnLi9wcm9wZXJ0aWVzJyk7XG5cbi8qKlxuICogVGhpcyBpcyBhIG1vZHVsZSBmb3IgbWFuYWdpbmcgUkVTVF9BUEkgTW9kZWxzXG4gKi9cbmZ1bmN0aW9uIE1vZGVsTWFuYWdlciAoKSB7XG4gICAgdmFyIGJvb2xlYW5zLCBtb2RlbHNIYXNoO1xuICAgIG1vZGVsc0hhc2ggPSB7fTsgXG5cbiAgICAvL0FwaSBwcmVmaXggZm9yIHRoZSB3ZWIgc2VydmljZXNcbiAgICBtbS5hcGkgPSB7fTtcbiAgICBtbS5hcGkucHJlZml4ID0gbS5wcm9wKCcvYXBpJyk7XG5cbiAgICBtbS5hcGkuZ2V0ID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cmwgOiBtbS5hcGkucHJlZml4KCkuY29uY2F0KCcvJywgdGhpcy5zZXJ2aWNlTmFtZSgpLCAnLycsIGlkKSxcbiAgICAgICAgICAgIG1ldGhvZCA6ICdHRVQnXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIG1tLmFwaS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cmwgOiBtbS5hcGkucHJlZml4KCkuY29uY2F0KCcvJywgdGhpcy5zZXJ2aWNlTmFtZSgpKSxcbiAgICAgICAgICAgIG1ldGhvZCA6ICdQT1NUJ1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBtbS5hcGkudXBkYXRlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgbW0uYXBpWydkZWxldGUnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBtbS5wcm9wZXJ0aWVzID0gcHJvcHM7XG5cbiAgICAvKiogXG4gICAgICogQWNjZXNvciBmb3IgdGhlIE1vZGVsc01hbmFnZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtbSAobW9kZWxOYW1lLCBjb25zdHJ1Y3RvckZuKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxzSGFzaFttb2RlbE5hbWVdO1xuICAgICAgICB9XG4gICAgICAgIG1vZGVsc0hhc2hbbW9kZWxOYW1lXSA9IGNyZWF0ZU1vZGVsKG1vZGVsTmFtZSwgY29uc3RydWN0b3JGbik7XG4gICAgICAgIHJldHVybiBtb2RlbHNIYXNoW21vZGVsTmFtZV07XG4gICAgfTtcblxuICAgIC8qKiBcbiAgICAgKiBGdW5jdGlvbiB0aGF0IGNvbnN0cnVjdHMgYSBtb2RlbCBmcm9tIGEgTmFtZSBhbmQgYSBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNyZWF0ZU1vZGVsIChtb2RlbE5hbWUsIGNvbnN0cnVjdG9yRm4pIHtcbiAgICAgICAgdmFyIF9pZEtleSwgX3NlcnZpY2VOYW1lLCBhZGRQcm9wLCBkZWZhdWx0R2V0VXJsLCBnZXRVcmwsIHByb3BzO1xuICAgICAgICAvL1B1bGwgZm9yIHRoZSBwcm9wZXJ0aWVzXG4gICAgICAgIHByb3BzID0ge307XG4gICAgICAgIC8vTmFtZSBvZiB0aGUgc2VydmljZSB0byB3b3JrIHdpdGggdGhlIGFwaVxuICAgICAgICBfc2VydmljZU5hbWUgPSBtb2RlbE5hbWU7XG4gICAgICAgIC8vUHJvcGVydHkga2V5IG9mIHRoZSBpZGVudGlmaWVyIHByb3BlcnR5XG4gICAgICAgIF9pZEtleSA9ICdpZCc7XG4gICAgICAgIHZhciBpbnRlcm5hbEdldFVybDtcblxuICAgICAgICAvKlxuICAgICAgICBDb25zdHJ1Y3QgdGhlIFVybCBvZiB0aGUgbW9kZWxcbiAgICAgICAgICovXG4gICAgICAgIGdldFVybCA9IGZ1bmN0aW9uKHR5cGUsIGlkKSB7XG4gICAgICAgICAgICBpZiAoaW50ZXJuYWxHZXRVcmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50ZXJuYWxHZXRVcmwodHlwZSwgaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdEdldFVybCh0eXBlLCBpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqIFxuICAgICAgICAgKiBUaGUgdXJsIGZvciB0aGUgc2VydmljZXNcbiAgICAgICAgICovXG4gICAgICAgIGRlZmF1bHRHZXRVcmwgPSBmdW5jdGlvbih1cmxUeXBlLCBpZCkge1xuICAgICAgICAgICAgdmFyIHVybCwgdXJsUGFyYW1zO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB1cmwgPSBtbS5hcGlQcmVmaXgoKS5jb25jYXQoX3NlcnZpY2VOYW1lKTtcbiAgICAgICAgICAgIHVybFBhcmFtcyA9IHt9O1xuXG4gICAgICAgICAgICBpZiAodXJsVHlwZSA9PT0gJ2lkJykge1xuICAgICAgICAgICAgICAgIHVybCArPSAnL2dldC8nLmNvbmNhdChpZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYodXJsVHlwZSA9PT0gJ2NyZWF0ZScpIHtcbiAgICAgICAgICAgICAgICB1cmwgKz0gJy9jcmVhdGUnO1xuICAgICAgICAgICAgfSBcblxuICAgICAgICAgICAgcmV0dXJuIHVybC5jb25jYXQobS5yb3V0ZS5idWlsZFF1ZXJ5U3RyaW5nKHVybFBhcmFtcykpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vTW9kZWxOYW1lIGdldHRlclxuICAgICAgICBjb25zdHJ1Y3RvckZuLm1vZGVsTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZGVsTmFtZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvL01vZGVsTmFtZSBnZXR0ZXIvc2V0dGVyXG4gICAgICAgIGNvbnN0cnVjdG9yRm4uc2VydmljZU5hbWUgPSBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBfc2VydmljZU5hbWUgPSBpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvckZuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIF9zZXJ2aWNlTmFtZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvL0lkS2V5IGdldHRlci9zZXR0ZXJcbiAgICAgICAgY29uc3RydWN0b3JGbi5pZEtleSA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIF9pZEtleSA9IGk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yRm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gX2lkS2V5O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgUHJvcGVydHlcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0cnVjdG9yRm4ucHJvcCA9IGZ1bmN0aW9uKHByb3BOYW1lLCBwcm9wUGFyYW1zKSB7XG4gICAgICAgICAgICBwcm9wUGFyYW1zLm5hbWUgPSBwcm9wTmFtZTtcbiAgICAgICAgICAgIHByb3BzW3Byb3BOYW1lXSA9IGNyZWF0ZVByb3BlcnR5KHByb3BQYXJhbXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqIFxuICAgICAgICAgKiBDcmVhdGVzIGEgTWV0aG9kXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdHJ1Y3RvckZuLm1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZE5hbWUsIG1ldGhvZEZuKSB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvckZuLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IG1ldGhvZEZuO1xuICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yRm47XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqIFxuICAgICAgICAgKiBJbml0aWFsaXplIGEgbmV3IGluc3RhbmNlIGJ5IGNvcHkgdGhlIGRhdGEgaGFzaCB0byBtb2RlbCBwcm9wZXJ0aWVzXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdHJ1Y3RvckZuLmluaXRpYWxpemVJbnN0YW5jZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEgfHwgKGRhdGEgPSB7fSk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhwcm9wcykuZm9yRWFjaChhZGRQcm9wLmJpbmQodGhpcywgZGF0YSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9cbiAgICAgICAgZnVuY3Rpb24gYWRkUHJvcChkYXRhLCBrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3Byb3BzW2tleV0ubmFtZV0gPSBtLnByb3AoZGF0YVtwcm9wc1trZXldLm5hbWVdIHx8IG51bGwpO1xuICAgICAgICB9O1xuICAgICAgICBcblxuICAgICAgICBjb25zdHJ1Y3RvckZuLmlkID0gZnVuY3Rpb24gKHJlc291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb3VyY2VbX2lkS2V5XSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yRm4uc2F2ZSA9IGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5yZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IGdldFVybCgnY3JlYXRlJyksXG4gICAgICAgICAgICAgICAgZGF0YSA6IHJlc291cmNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdHJ1Y3RvckZuLmdldCA9IGZ1bmN0aW9uKGlkLCBleHRyYUFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBtLnJlcXVlc3QoXy5leHRlbmQoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBnZXRVcmwoJ2lkJywgaWQpLFxuICAgICAgICAgICAgICAgIHVud3JhcFN1Y2Nlc3M6IGZ1bmN0aW9uIChyKSB7IFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNvbnN0cnVjdG9yRm4oci5kYXRhKTsgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxleHRyYUFyZ3MpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdHJ1Y3RvckZuLmZpbmQgPSBmdW5jdGlvbiAoaVF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gbS5yZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICBtZXRob2QgOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmwgOiBnZXRVcmwoJ2ZpbmQnLCBpUXVlcnkpLFxuICAgICAgICAgICAgICAgIHVud3JhcFN1Y2Nlc3MgOiBmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gci5kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29uc3RydWN0b3JGbihpdGVtKTsgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjb25zdHJ1Y3RvckZuO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVQcm9wZXJ0eSAocHJvcFBhcmFtcykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbS5wcm9wO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hbWU6IHByb3BQYXJhbXMubmFtZVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4gbW07XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG5vdGlmeTtcblxuZnVuY3Rpb24gbm90aWZ5IChzdGF0dXMsIHRleHQpIHtcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgICAgICB0ZXh0ICA9IHN0YXR1cztcbiAgICAgICAgc3RhdHVzID0gJ3N1Y2Nlc3MnIFxuICAgIH1cbiAgICB2YXIgbm90aWYgPSAkKCc8ZGl2IGNsYXNzPVwiZ2xvYmFsLW5vdGlmaWNhdGlvblwiPicgKyAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LScgKyBzdGF0dXMgKyAnXCI+JyArIHRleHQgKyAnPC9kaXY+PC9kaXY+Jyk7XG4gICAgXG4gICAgbm90aWYuYXBwZW5kVG8oJCgnYm9keScpKTtcbiAgICBcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbm90aWYucmVtb3ZlKCk7XG4gICAgfSwyMDAwKVxufTtcbiIsInZhciBwcm9wZXJ0aWVzID0ge307XG5tb2R1bGUuZXhwb3J0cyA9IHByb3BlcnRpZXM7XG5cbnByb3BlcnRpZXMuc3RyaW5nID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgdmFyIGludGVybmFsLCBwcm9wLCBzZXQsIHZhbGlkYXRlO1xuICAgIGludGVybmFsID0gbS5wcm9wKCk7XG5cbiAgICBzZXQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIGludGVybmFsKHZhbCk7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZSgpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbGlkO1xuICAgICAgICB2YWxpZCA9IHBhcmFtcy5tYXRjaCA/IGludGVybmFsKCkubWF0Y2gocGFyYW1zLm1hdGNoKSA6IHRydWU7XG4gICAgICAgIHJldHVybiBwcm9wLnZhbGlkKHZhbGlkID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICB9O1xuXG4gICAgcHJvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXQoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcm5hbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb3AudmFsaWQgPSBtLnByb3AoKTtcbiAgICByZXR1cm4gcHJvcDtcbn07XG5cbnByb3BlcnRpZXMubnVtYmVyID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgdmFyIHByb3A7XG4gICAgcHJvcCA9IG0ucHJvcCgpO1xuICAgIHJldHVybiBwcm9wO1xufTtcblxuYm9vbGVhbnMgPSB7XG4gICAgJ3RydWUnOiB0cnVlLFxuICAgICcxJzogdHJ1ZSxcbiAgICAnMCc6IGZhbHNlLFxuICAgICdmYWxzZSc6IGZhbHNlLFxuICAgICdvbic6IHRydWUsXG4gICAgJ29mZic6IHRydWUsXG4gICAgJ251bGwnOiBmYWxzZVxufTtcblxucHJvcGVydGllcy5ib29sZWFuID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgdmFyIGludGVybmFsLCBwcm9wLCBzZXQ7XG4gICAgaW50ZXJuYWwgPSBtLnByb3AoKTtcbiAgICBwcm9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0KGFyZ3VtZW50c1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJuYWwoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIHNldCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcm5hbCh2b2lkIDApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYm9vbGVhbnNbU3RyaW5nKHZhbCldID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIGludGVybmFsKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGludGVybmFsKGJvb2xlYW5zW1N0cmluZyh2YWwpXSk7XG4gICAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHZtRmFjdG9yeTtcblxuZnVuY3Rpb24gdm1GYWN0b3J5IChwYXJhbXMpIHtcbiAgICB2YXIgbWFwID0ge307XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChyZWZlcmVuY2UpIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtcy5rZXkocmVmZXJlbmNlKTtcbiAgICAgICAgbWFwW2tleV0gfHwgKG1hcFtrZXldID0gcGFyYW1zLmNyZWF0ZShyZWZlcmVuY2UpKTtcbiAgICAgICAgcmV0dXJuIG1hcFtrZXldO1xuICAgIH1cbn0iXX0=
