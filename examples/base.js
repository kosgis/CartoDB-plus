
CartoDBWrapper = {
        
    /**
     * The element id
     */
    id: 'map',
    
    /**
     * The map object
     */
    map: null,
    
    /**
     * The config file content
     */
    config: null,
    
    layers: [],
    
    layerCount: 0,
    
    element: null,
    
    getLayer: function (layers,internalID) {
        for (var i=0;i<layers.langth;i++) {
            if (layers[i].id === internalID) {
                return layers[i];
            } else {
                if (typeof layers[i].layers !== 'undefined') {
                    var layer = this.getLayer(layers[i].layers,internalID);
                    if (layer !== null) {
                        return layer;
                    }
                }
            }
        }
        return null;
    },
    
    /**
     * Method for getting the configuration
     */
    init: function (id) {
        this.id = id;
        this.element = $('#'+this.id);
        this.element.addClass('carto-wrapper-container');
        this.element.append('<div class="carto-wrapper-map" id="'+this.id+'_carto-wrapper"></div>');
        if (this.config === null) {
            var configName = this.getURLParameter('c');
            $.ajax({
                url: 'config/'+configName+'.json',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                success: this.bind(function (data) {
                    this.config = data;
                    this.setMap();
                },this)
            });
        } else {
            this.setMap();
        }
    },
    
    /**
     * Method for initializing the Map on start
     */
    setMap: function () {
        this.map = new L.Map(this.id+'_carto-wrapper', this.config.map);
        L.tileLayer(this.config.baseLayer.URLtemplate, this.config.baseLayer.options).addTo(this.map);

        for (var i=0;i<this.config.layers.length;i++) {
            //TODO: Hent det rigtige navn fra vis.json
            var name = this.config.layers[i].configType;
            if (typeof this.config.layers[i].name !== 'undefined') {
                name = this.config.layers[i].name;
            }
            var configlayer = {
                id: (Math.random()+1).toString(36).substring(2,8),
                type: this.config.layers[i].configType,
                name: name,
                vis: null,
                layers: [],
                visible: (this.config.layers[i].visible === true),
                terms: name
            };
            
            console.log(configlayer.visible);
            
            this.layers.push(configlayer);
            
            var options = null
            if (this.config.layers[i].configType === 'visualization') {
                options = this.config.layers[i].url;
            } else {
                options = this.config.layers[i];
            }
            cartodb.createLayer(this.map, options).addTo(this.map).done(this.bind(function(configlayer,layer) {
                
                configlayer.layer = layer;
                configlayer.element = $('<li><i class="fa fa-picture-o"></i><i class="fa fa-check"></i>'+configlayer.name+'</li>');
                configlayer.element.click(this.bind(this.toogleLayer,this,configlayer));
                if (configlayer.visible === true) {
                    configlayer.element.addClass('active');
                } else {
                    configlayer.layer.hide();
                }
                configlayer.element.addClass('main');
                
                if (layer.layers.length > 1) {
                    for (var i=0;i<layer.layers.length;i++) {
                        var l = {
                            id: (Math.random()+1).toString(36).substring(2,8),
                            type: 'sublayer',
                            name: layer.layers[i].layer_name,
                            vis: configlayer,
                            layer: layer.getSubLayer(i),
                            visible: configlayer.visible,
                            terms: layer.layers[i].layer_name
                        };
                        l.element = $('<li><i class="fa fa-table"></i><i class="fa fa-check"></i>'+l.name+'</li>');
                        l.element.click(this.bind(this.toogleLayer,this,l));
                        if (l.visible === true) {
                            l.element.addClass('active');
                        } else {
                            l.layer.hide();
                        }
                        configlayer.layers.push(l);
                    }
                
                }
                
                this.layerCount++;
                if (this.layerCount === this.config.layers.length) {
                    this.setGui();
                }
                
            },this,configlayer));
        }
    },

    /**
     * Method for initializing the GUI
     */
    setGui: function () {
        
        if (typeof this.config.controls !== 'undefined') { 
            if (typeof this.config.controls.layersearch !== 'undefined') {
                var search = $('<div class="carto-wrapper-search"></div>');
                
                search.append('<div class="carto-wrapper-searchinput"><div class="carto-wrapper-searchfield"><i class="fa fa-search"></i><input placeholder="Søg efter lag"/></div><div class="carto-wrapper-searchbutton"><i class="fa fa-bars"></i></div></div>');
                
                var input = search.find('input');
                input.keyup(this.bind(function (input,event) {
                    var val = input.val();
                    if (val === '') {
                        var allLayers = this.getAllLayers();
                        for (var i=0;i<allLayers.length;i++) {
                            allLayers[i].element.show();
                        }
                    } else {
                        var allLayers = this.getAllLayers();
                        for (var i=0;i<allLayers.length;i++) {
                            allLayers[i].element.hide();
                        }
                        this.search(val);
                    }
                },this,input));
                
                var resultcontainer = $('<div class="carto-wrapper-searchresult"></div>');
//                resultcontainer.hide();
                search.find('.carto-wrapper-searchbutton').click(this.bind(function (element) {
                    element.toggle();
                },this,resultcontainer));
                
                this.resultList = $('<ul></ul>');
                resultcontainer.append(this.resultList);
                search.append(resultcontainer);
                this.element.append(search);
                
                for (var i=0;i<this.layers.length;i++) {
                    this.resultList.append(this.layers[i].element);
                    if (typeof this.layers[i].layers !== 'undefined' && this.layers[i].layers.length > 1) {
                        for (var j=0;j<this.layers[i].layers.length;j++) {
                            this.resultList.append(this.layers[i].layers[j].element);
                        }
                    }                    
                }
                
            }
        }
    },
    
    getAllLayers: function (layers) {
        if (typeof layers === 'undefined') {
            layers = this.layers;
        }
        var result = [];
        
        for (var i=0;i<layers.length;i++) {
            result.push(layers[i]);
            if (typeof layers[i].layers !== 'undefined') {
                result = result.concat(this.getAllLayers(layers[i].layers));
            }
        }
        return result
    },
    
    search: function (str,layers) {
        
        if (typeof layers === 'undefined') {
            layers = this.layers;
        }
        var result = [];
        
        var reg = new RegExp(str,'gi');
        for (var i=0;i<layers.length;i++) {
            var hit = layers[i].terms.match(reg);
            if (hit !== null) {
                if (layers[i].vis !== null) {
                    result.push(layers[i].vis);
                    layers[i].vis.element.show();
                }
                result.push(layers[i]);
                layers[i].element.show();
            }
            if (typeof layers[i].layers !== 'undefined') {
                result = result.concat(this.search(str,layers[i].layers));
            }
        }
        return result
    },
    
    toogleLayer: function (layer) {
        if (layer.vis === null) {
            for (var i=0;i<layer.layers.length;i++) {
                if (layer.visible === true) {
                    this._hideLayer(layer.layers[i]);
                } else {
                    this._showLayer(layer.layers[i]);
                }
            }
        } else {
            this._showLayer(layer.vis);
        }
        if (layer.visible === true) {
            this._hideLayer(layer);
        } else {
            this._showLayer(layer);
        }
    },

    _showLayer: function (layer) {
        layer.element.addClass('active');
        layer.layer.show();
        layer.visible = true;
    },

    _hideLayer: function (layer) {
        layer.element.removeClass('active');
        layer.layer.hide();
        layer.visible = false;
    },

    /**
     * Helper method that returns the value of a named URL parameter.
     * 
     * Parameters:
     * name - {String} The name of the parameter.
     * 
     * Returns:
     * {String} The value. Null if no value
     */
    getURLParameter: function (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
    },
    
    /**
     * Helper method that binds a function to an object. Method to easily create closures with 'this' altered.
     * 
     * Parameters:
     * func - {Function} Input function.
     * object - {Object} The object to bind to the input function (as this).
     * 
     * Returns:
     * {Function} A closure with 'this' set to the passed in object.
     */
    bind: function(func, object) {
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function() {
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    }
};

