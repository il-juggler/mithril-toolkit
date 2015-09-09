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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbHNvbC9wcm9qZWN0cy9pbnp1cnJla3QvbWl0aHJpbC10b29sa2l0L25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9hbHNvbC9wcm9qZWN0cy9pbnp1cnJla3QvbWl0aHJpbC10b29sa2l0L2Zha2VfY2ExMDU0MzQuanMiLCIvVXNlcnMvYWxzb2wvcHJvamVjdHMvaW56dXJyZWt0L21pdGhyaWwtdG9vbGtpdC9pbmRleC5qcyIsIi9Vc2Vycy9hbHNvbC9wcm9qZWN0cy9pbnp1cnJla3QvbWl0aHJpbC10b29sa2l0L3NyYy9Nb2RlbE1hbmFnZXIuanMiLCIvVXNlcnMvYWxzb2wvcHJvamVjdHMvaW56dXJyZWt0L21pdGhyaWwtdG9vbGtpdC9zcmMvbm90aWZ5LmpzIiwiL1VzZXJzL2Fsc29sL3Byb2plY3RzL2luenVycmVrdC9taXRocmlsLXRvb2xraXQvc3JjL3Byb3BlcnRpZXMuanMiLCIvVXNlcnMvYWxzb2wvcHJvamVjdHMvaW56dXJyZWt0L21pdGhyaWwtdG9vbGtpdC9zcmMvdm1GYWN0b3J5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwid2luZG93Lm10ayA9IHJlcXVpcmUoJy4vaW5kZXguanMnKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwcm9wIDogcmVxdWlyZSgnLi9zcmMvcHJvcGVydGllcy5qcycpLFxuICAgIE1vZGVsTWFuYWdlciA6IHJlcXVpcmUoJy4vc3JjL01vZGVsTWFuYWdlci5qcycpLFxuICAgIHZtRmFjdG9yeSA6IHJlcXVpcmUoJy4vc3JjL3ZtRmFjdG9yeS5qcycpLFxuICAgIG5vdGlmeSA6IHJlcXVpcmUoJy4vc3JjL25vdGlmeS5qcycpXG59OyIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gTW9kZWxNYW5hZ2VyO1xuXG52YXIgcHJvcHMgPSByZXF1aXJlKCcuL3Byb3BlcnRpZXMnKTtcblxuLyoqXG4gKiBUaGlzIGlzIGEgbW9kdWxlIGZvciBtYW5hZ2luZyBSRVNUX0FQSSBNb2RlbHNcbiAqL1xuZnVuY3Rpb24gTW9kZWxNYW5hZ2VyICgpIHtcbiAgICB2YXIgYm9vbGVhbnMsIGNyZWF0ZVByb3BlcnR5LCBtb2RlbHNIYXNoO1xuICAgIG1vZGVsc0hhc2ggPSB7fTsgXG4gICAgXG4gICAgLy9BcGkgcHJlZml4IGZvciB0aGUgd2ViIHNlcnZpY2VzXG4gICAgbW0uYXBpID0ge307XG4gICAgbW0uYXBpLnByZWZpeCA9IG0ucHJvcCgnL2FwaScpO1xuXG4gICAgbW0uYXBpLmdldCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXJsIDogbW0uYXBpLnByZWZpeCgpLmNvbmNhdCgnLycsIHRoaXMuc2VydmljZU5hbWUoKSwgJy8nLCBpZCksXG4gICAgICAgICAgICBtZXRob2QgOiAnR0VUJ1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBtbS5hcGkuY3JlYXRlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVybCA6IG1tLmFwaS5wcmVmaXgoKS5jb25jYXQoJy8nLCB0aGlzLnNlcnZpY2VOYW1lKCkpLFxuICAgICAgICAgICAgbWV0aG9kIDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YSA6IGRhdGFcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgbW0uYXBpLnVwZGF0ZSA9IGZ1bmN0aW9uIChpZCwgZGF0YSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXJsIDogbW0uYXBpLnByZWZpeCgpLmNvbmNhdCgnLycsIHRoaXMuc2VydmljZU5hbWUoKSwgJy8nLCBpZCksXG4gICAgICAgICAgICBtZXRob2QgOiAnUFVUJyxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbW0uYXBpLmZpbmQgPSBmdW5jdGlvbiAoc2VhcmNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cmwgOiBtbS5hcGkucHJlZml4KCkuY29uY2F0KCcvJywgdGhpcy5zZXJ2aWNlTmFtZSgpKSxcbiAgICAgICAgICAgIG1ldGhvZCA6ICdHRVQnLFxuICAgICAgICAgICAgZGF0YSA6IHNlYXJjaCB8fMKge31cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtbS5hcGlbJ2RlbGV0ZSddID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cmwgOiBtbS5hcGkucHJlZml4KCkuY29uY2F0KCcvJywgdGhpcy5zZXJ2aWNlTmFtZSgpLCAnLycsIGlkKSxcbiAgICAgICAgICAgIG1ldGhvZCA6ICdERUxFVEUnXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbW0ucHJvcGVydGllcyA9IHByb3BzO1xuXG4gICAgLyoqIFxuICAgICAqIEFjY2Vzb3IgZm9yIHRoZSBNb2RlbHNNYW5hZ2VyXG4gICAgICpcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtbSAobW9kZWxOYW1lLCBjb25zdHJ1Y3RvckZuKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxzSGFzaFttb2RlbE5hbWVdO1xuICAgICAgICB9XG4gICAgICAgIG1vZGVsc0hhc2hbbW9kZWxOYW1lXSA9IGNyZWF0ZU1vZGVsKG1vZGVsTmFtZSwgY29uc3RydWN0b3JGbik7XG4gICAgICAgIHJldHVybiBtb2RlbHNIYXNoW21vZGVsTmFtZV07XG4gICAgfTtcblxuICAgIC8qKiBcbiAgICAgKiBGdW5jdGlvbiB0aGF0IGNvbnN0cnVjdHMgYSBtb2RlbCBmcm9tIGEgTmFtZSBhbmQgYSBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgICAqXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3JlYXRlTW9kZWwgKG1vZGVsTmFtZSwgY29uc3RydWN0b3JGbikge1xuICAgICAgICB2YXIgX2lkS2V5LCBfc2VydmljZU5hbWUsIGFkZFByb3AsIHByb3BzO1xuICAgICAgICAvL1B1bGwgZm9yIHRoZSBwcm9wZXJ0aWVzXG4gICAgICAgIHByb3BzID0ge307XG4gICAgICAgIC8vTmFtZSBvZiB0aGUgc2VydmljZSB0byB3b3JrIHdpdGggdGhlIGFwaVxuICAgICAgICBfc2VydmljZU5hbWUgPSBtb2RlbE5hbWU7XG4gICAgICAgIC8vUHJvcGVydHkga2V5IG9mIHRoZSBpZGVudGlmaWVyIHByb3BlcnR5XG4gICAgICAgIF9pZEtleSA9ICdpZCc7XG4gICAgICAgIHZhciBpbnRlcm5hbEdldFVybDtcblxuICAgICAgICAvL01vZGVsTmFtZSBnZXR0ZXJcbiAgICAgICAgY29uc3RydWN0b3JGbi5tb2RlbE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBtb2RlbE5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9Nb2RlbE5hbWUgZ2V0dGVyL3NldHRlclxuICAgICAgICBjb25zdHJ1Y3RvckZuLnNlcnZpY2VOYW1lID0gZnVuY3Rpb24oaSkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgX3NlcnZpY2VOYW1lID0gaTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3JGbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfc2VydmljZU5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9JZEtleSBnZXR0ZXIvc2V0dGVyXG4gICAgICAgIGNvbnN0cnVjdG9yRm4uaWRLZXkgPSBmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBfaWRLZXkgPSBpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvckZuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIF9pZEtleTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIFByb3BlcnR5XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdHJ1Y3RvckZuLnByb3AgPSBmdW5jdGlvbihwcm9wTmFtZSwgcHJvcFBhcmFtcykge1xuICAgICAgICAgICAgcHJvcFBhcmFtcy5uYW1lID0gcHJvcE5hbWU7XG4gICAgICAgICAgICBwcm9wc1twcm9wTmFtZV0gPSBjcmVhdGVQcm9wZXJ0eShwcm9wUGFyYW1zKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKiBcbiAgICAgICAgICogQ3JlYXRlcyBhIE1ldGhvZFxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3RydWN0b3JGbi5tZXRob2QgPSBmdW5jdGlvbihtZXRob2ROYW1lLCBtZXRob2RGbikge1xuICAgICAgICAgICAgY29uc3RydWN0b3JGbi5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBtZXRob2RGbjtcbiAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvckZuO1xuICAgICAgICB9O1xuXG5cblxuICAgICAgICBjb25zdHJ1Y3RvckZuLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBqc29uID0ge307XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgaWYoay5pbmRleE9mKCckJykgPT0gMCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIHNlbGZba10udG9KU09OID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzb25ba10gPSBzZWxmW2tdLnRvSlNPTigpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAganNvbltrXSA9IHNlbGZba10oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGpzb247XG4gICAgICAgIH07XG4gICAgICAgIC8qKiBcbiAgICAgICAgICogSW5pdGlhbGl6ZSBhIG5ldyBpbnN0YW5jZSBieSBjb3B5IHRoZSBkYXRhIGhhc2ggdG8gbW9kZWwgcHJvcGVydGllc1xuICAgICAgICAgKi9cbiAgICAgICAgY29uc3RydWN0b3JGbi5pbml0aWFsaXplSW5zdGFuY2UgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBkYXRhIHx8IChkYXRhID0ge30pO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goYWRkUHJvcC5iaW5kKHRoaXMsIGRhdGEpKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb3AoZGF0YSwga2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1twcm9wc1trZXldLm5hbWVdID0gbS5wcm9wKGRhdGFbcHJvcHNba2V5XS5uYW1lXSB8fCBudWxsKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG5cbiAgICAgICAgY29uc3RydWN0b3JGbi5pZCA9IGZ1bmN0aW9uIChyZXNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlW19pZEtleV0uY2FsbCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yRm4uc2F2ZSA9IGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgICAgICAgICB2YXIgcVBhcmFtcyA9IF8uZXh0ZW5kKHt9LCBtbS5hcGkuY3JlYXRlLmNhbGwoY29uc3RydWN0b3JGbiwgcmVzb3VyY2UpKTtcbiAgICAgICAgICAgIHJldHVybiBtLnJlcXVlc3QocVBhcmFtcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3RydWN0b3JGbi5nZXQgPSBmdW5jdGlvbihpZCwgZXh0cmFBcmdzKSB7XG4gICAgICAgICAgICB2YXIgcVBhcmFtcyA9IF8uZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICB1bndyYXBTdWNjZXNzIDogZnVuY3Rpb24gKHIpIHsgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29uc3RydWN0b3JGbiggci5kYXRhICk7IFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIG1tLmFwaS5nZXQuY2FsbChjb25zdHJ1Y3RvckZuLGlkKSwgZXh0cmFBcmdzKTtcblxuICAgICAgICAgICAgcmV0dXJuIG0ucmVxdWVzdChxUGFyYW1zKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdHJ1Y3RvckZuLmZpbmQgPSBmdW5jdGlvbiAoaVF1ZXJ5LCBleHRyYUFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBxUGFyYW1zID0gXy5leHRlbmQoe1xuICAgICAgICAgICAgICAgIHVud3JhcFN1Y2Nlc3MgOiBmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gci5kYXRhLm1hcChmdW5jdGlvbiAoaXRlbSkgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY29uc3RydWN0b3JGbihpdGVtKTsgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sbW0uYXBpLmZpbmQuY2FsbChjb25zdHJ1Y3RvckZuLCBpUXVlcnkpLCBleHRyYUFyZ3MpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhxUGFyYW1zKTtcblxuICAgICAgICAgICAgcmV0dXJuIG0ucmVxdWVzdChxUGFyYW1zKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yRm47XG4gICAgfTtcblxuICAgIGNyZWF0ZVByb3BlcnR5ID0gZnVuY3Rpb24ocHJvcFBhcmFtcykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbS5wcm9wO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hbWU6IHByb3BQYXJhbXMubmFtZVxuICAgICAgICB9O1xuICAgIH07XG5cblxuICAgIHJldHVybiBtbTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbm90aWZ5O1xuXG5mdW5jdGlvbiBub3RpZnkgKHN0YXR1cywgdGV4dCkge1xuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICAgIHRleHQgID0gc3RhdHVzO1xuICAgICAgICBzdGF0dXMgPSAnc3VjY2VzcycgXG4gICAgfVxuICAgIHZhciBub3RpZiA9ICQoJzxkaXYgY2xhc3M9XCJnbG9iYWwtbm90aWZpY2F0aW9uXCI+JyArICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtJyArIHN0YXR1cyArICdcIj4nICsgdGV4dCArICc8L2Rpdj48L2Rpdj4nKTtcbiAgICBcbiAgICBub3RpZi5hcHBlbmRUbygkKCdib2R5JykpO1xuICAgIFxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBub3RpZi5yZW1vdmUoKTtcbiAgICB9LDIwMDApXG59O1xuIiwidmFyIHByb3BlcnRpZXMgPSB7fTtcbm1vZHVsZS5leHBvcnRzID0gcHJvcGVydGllcztcblxucHJvcGVydGllcy5zdHJpbmcgPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICB2YXIgaW50ZXJuYWwsIHByb3AsIHNldCwgdmFsaWRhdGU7XG4gICAgaW50ZXJuYWwgPSBtLnByb3AoKTtcblxuICAgIHNldCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgaW50ZXJuYWwodmFsKTtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlKCk7XG4gICAgfTtcblxuICAgIHZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsaWQ7XG4gICAgICAgIHZhbGlkID0gcGFyYW1zLm1hdGNoID8gaW50ZXJuYWwoKS5tYXRjaChwYXJhbXMubWF0Y2gpIDogdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHByb3AudmFsaWQodmFsaWQgPyB0cnVlIDogZmFsc2UpO1xuICAgIH07XG5cbiAgICBwcm9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNldChhcmd1bWVudHNbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGludGVybmFsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvcC52YWxpZCA9IG0ucHJvcCgpO1xuICAgIHJldHVybiBwcm9wO1xufTtcblxucHJvcGVydGllcy5udW1iZXIgPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICB2YXIgcHJvcDtcbiAgICBwcm9wID0gbS5wcm9wKCk7XG4gICAgcmV0dXJuIHByb3A7XG59O1xuXG5ib29sZWFucyA9IHtcbiAgICAndHJ1ZSc6IHRydWUsXG4gICAgJzEnOiB0cnVlLFxuICAgICcwJzogZmFsc2UsXG4gICAgJ2ZhbHNlJzogZmFsc2UsXG4gICAgJ29uJzogdHJ1ZSxcbiAgICAnb2ZmJzogdHJ1ZSxcbiAgICAnbnVsbCc6IGZhbHNlXG59O1xuXG5wcm9wZXJ0aWVzLmJvb2xlYW4gPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICB2YXIgaW50ZXJuYWwsIHByb3AsIHNldDtcbiAgICBpbnRlcm5hbCA9IG0ucHJvcCgpO1xuICAgIHByb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXQoYXJndW1lbnRzWzBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcm5hbCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gc2V0ID0gZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIGludGVybmFsKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBib29sZWFuc1tTdHJpbmcodmFsKV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJuYWwodm9pZCAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW50ZXJuYWwoYm9vbGVhbnNbU3RyaW5nKHZhbCldKTtcbiAgICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdm1GYWN0b3J5O1xuXG5mdW5jdGlvbiB2bUZhY3RvcnkgKHBhcmFtcykge1xuICAgIHZhciBtYXAgPSB7fTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHJlZmVyZW5jZSkge1xuICAgICAgICB2YXIga2V5ID0gcGFyYW1zLmtleShyZWZlcmVuY2UpO1xuICAgICAgICBtYXBba2V5XSB8fCAobWFwW2tleV0gPSBwYXJhbXMuY3JlYXRlKHJlZmVyZW5jZSkpO1xuICAgICAgICByZXR1cm4gbWFwW2tleV07XG4gICAgfVxufSJdfQ==
