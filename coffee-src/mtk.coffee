'use strict';

modelsHash = {}

#Funcion principal para crear modelos
mm  = (modelName, constructorFn) ->
    if arguments.length == 1
        return modelsHash[modelName]
    modelsHash[modelName] = createModel(modelName, constructorFn)
    modelsHash[modelName]

#Configuración del Api
mm.apiPrefix = m.prop('/api')

mm.props = {}

mm.props.string = (params) ->
    internal = m.prop()
    
    set = (val) -> 
        internal(val)
        validate()

    validate = () ->
        valid = if(params.match) then internal().match(params.match) else true
        prop.valid(if valid then true else false)

    prop = () -> if(arguments.length) then set(arguments[0]) else internal()
    prop.valid = m.prop()

    prop
        


mm.props.number = (params) ->
    prop = m.prop()
    prop


booleans = 
    'true' : true
    '1'    : true
    '0'    : false
    'false': false
    'on'   : true
    'off'  : true
    'null' : false


mm.props.boolean = (params) ->
    internal = m.prop()
    
    prop = () -> if(arguments.length) then set(arguments[0]) else internal()
    
    set = (val) ->
        if(typeof val is 'undefined') then return internal(undefined)
        if(typeof booleans[String(val)] is 'undefined') then return internal(undefined)
        internal( booleans[String(val)] )




#Crear un modelo
createModel = (modelName, constructorFn) -> 

    props        = {}
    _serviceName = modelName
    _idKey       = 'id'

    ###
    Construct the Url of the model
    ###

    getUrl = (type, id) -> 
        if internalGetUrl then internalGetUrl(type,id) else defaultGetUrl(type,id)

    defaultGetUrl = (urlType, id) ->
        url = mm.apiPrefix() 
        urlParams = { modelo : _serviceName  }

        if(urlType == 'id') then urlParams[_idKey] = id

        url.concat( $.param(urlParams) )


    constructorFn.modelName = () -> modelName

    ##GetterSetter for the service name
    constructorFn.serviceName  = (i) ->
        if(arguments.length > 0)  
            _serviceName = i
            return constructorFn

        _serviceName

    #Getter/Setter for the idKey
    constructorFn.idKey  = (i) ->
        if(arguments.length > 0)  
            _idKey = i
            return constructorFn

        _idKey

    ###
       Property creator 
    ###
    constructorFn.prop = (propName, propParams) ->
        propParams.name = propName
        props[propName] = createProperty(propParams)
        @


    constructorFn.method = (methodName, methodFn) ->
        constructorFn::[methodName] = methodFn


    constructorFn.initializeInstance = (data) ->
        data or (data = {})
        Object.keys(props).forEach addProp.bind(@, data)
        @



    addProp = (data, key) ->     
        @[props[key].name] = m.prop(data[props[key].name] ||  null)


    constructorFn.save   = (resource) ->
        m.request
            method : 'POST',
            url    :  getUrl('create')


    constructorFn.get = (id) ->
        m.request
            method : 'GET',
            url    : getUrl('id',id)

    constructorFn



createProperty = (propParams) ->
    {
        create : () -> m.prop
        name : propParams.name
    }


@mm = mm;