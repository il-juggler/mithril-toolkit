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
