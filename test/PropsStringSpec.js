describe('mm.props.string', function () {

    var strProp = mm.props.string({ match : /o$/ });


    it('must be a function', function () {
        expect(typeof strProp).toBe('function');
    });


    it('must have no initial value', function () {
        expect(typeof strProp()).toBe('undefined');
    });

    it('must assign a value', function () {
        strProp('Hola Mundo');
        expect(strProp()).toBe('Hola Mundo');
    });


    it('must have a valid method', function () {
        expect(typeof strProp.valid).toBe('function')
    });


    it('probar regexp', function () {

    });


    it('must have a match validation Valid', function () {
        strProp('omino')
        expect(strProp.valid()).toBe(true);
    })

    it('must have a match validation Invalid', function () {
        strProp('asidjf')
        expect(strProp.valid()).toBe(false);
    })

    
});