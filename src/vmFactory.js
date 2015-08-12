module.exports = vmFactory;

function vmFactory (params) {
    var map = {};
    return function (reference) {
        var key = params.key(reference);
        map[key] || (map[key] = params.create(reference));
        return map[key];
    }
}