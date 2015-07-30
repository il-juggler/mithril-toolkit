describe('mm Mithril Model', function () {

    var model = mm('Operacion', Operacion)
                    .idKey('operacion_id')
                    .prop('name', {type : 'string'})

    function Operacion (data) {
        Operacion.initializeInstance.call(this,data);
    }

    var op;

    it('should model be the constructor function', function () {
        expect(Operacion).toBe(model);
    });


    it('should have modelName', function () {
        //expect(typeof Operacion.modelName).toBe('function');
        expect(Operacion.modelName()).toBe('Operacion');
    });


    it('should have an idKey', function () {
        //expect(typeof Operacion.idKey).toBe('function');
        expect(Operacion.idKey()).toBe('operacion_id');
    });


    it('should have save function', function () {
        expect(typeof Operacion.save).toBe('function');
    });


    it('should be instantiable', function () {
        op = new Operacion({name:'hello'});
        expect(op instanceof Operacion).toBe(true);
    });


    it('should have a property called name', function () {
        expect(typeof op.name).toBe('function');
    });

    it('should name property be hello', function () {
        expect(op.name()).toBe('hello');
    });

})