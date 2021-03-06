if (!ORYX.Plugins) 
    ORYX.Plugins = {};

if (!ORYX.Config)
	ORYX.Config = {};

ORYX.Config.Dictionary = {};

if(!ORYX.Dictionary) ORYX.Dictionary = {};

ORYX.Dictionary.DictionaryDef = Ext.data.Record.create([{
    name: 'name'
}, {
    name: 'aliases'
}, {
	name: 'description'
}
]);

ORYX.Dictionary.DictionaryProxy = new Ext.data.MemoryProxy({
    root: []
});

ORYX.Dictionary.Dictionaryitems = new Ext.data.Store({
	autoDestroy: true,
    reader: new Ext.data.JsonReader({
        root: "root"
    }, ORYX.Dictionary.DictionaryDef),
    proxy: ORYX.Dictionary.DictionaryProxy, 
    sorters: [{
        property: 'name',
        direction:'ASC'
    }]
});
ORYX.Dictionary.Dictionaryitems.load();

ORYX.Plugins.Dictionary = Clazz.extend({
	construct: function(facade){
		this.facade = facade;
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DICTIONARY_ADD, this.initAndShowDictionary.bind(this));
		
		this.initDictionary();
		
		/* Register dictionary to model */
		this.facade.offer({
			'name': 'Dictionary',
			'functionality': this.initAndShowDictionary.bind(this),
			'group': ORYX.I18N.View.jbpmgroup,
			'icon': ORYX.BASE_FILE_PATH + "images/dictionary.png",
			'description': 'Process dictionary',
			'index': 8,
			'minShape': 0,
			'maxShape': 0,
			'isEnabled': function(){
                return true;
//				profileParamName = "profile";
//				profileParamName = profileParamName.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
//				regexSa = "[\\?&]"+profileParamName+"=([^&#]*)";
//		        regexa = new RegExp( regexSa );
//		        profileParams = regexa.exec( window.location.href );
//		        profileParamValue = profileParams[1];
//				return profileParamValue == "jbpm";
			}.bind(this)
		});
	},
	initAndShowDictionary : function(options) {
		this.initDictionary(this.showDictionary, options);
	},
	initDictionary: function(callback,options) {
		Ext.Ajax.request({
            url: ORYX.PATH + 'dictionary',
            method: 'POST',
            success: function(response) {
    	   		try {
            		ORYX.Dictionary.Dictionaryitems.removeAll();
    	   			var responseJson = Ext.decode(response.responseText);
    	   			if(responseJson.length > 0 && responseJson != "false") {
    		        	for(var i=0;i<responseJson.length;i++){
    		                var obj = responseJson[i];
    		                var entryName = "";
    		                var entryAliases = "";
    		                var entryDesc = "";
    		                for(var key in obj){
    		                    var attrName = key;
    		                    var attrValue = obj[key];
    		                    if(attrName == "name") {
    		                    	if(attrValue) {
    		                    		entryName = attrValue;
    		                    	}
    		                    } else if(attrName == "aliases") {
    		                    	if(attrValue) {
    		                    		entryAliases = attrValue;
    		                    	}
    		                    } else if(attrName == "description") {
    		                    	if(attrValue) {
    		                    		entryDesc = attrValue;
    		                    	}
    		                    } else {
    		                    	Ext.Msg.alert('Error reading Process Dictionary. Invalid item: ' + attrName);
    		                    }
    		                }
    		                ORYX.Dictionary.Dictionaryitems.add(new ORYX.Dictionary.DictionaryDef({
                                name: entryName,
                                aliases: entryAliases,
                                description: entryDesc
                            }));
    		            }
    		        }
    	   			if(options && options.entry) {
    	   				if(options.entry.length > 0) {
	    	   				ORYX.Dictionary.Dictionaryitems.add(new ORYX.Dictionary.DictionaryDef({
	                            name: options.entry,
	                            aliases: '',
	                            description: ''
	                        }));
    	   				}
    	   			}
    	   			ORYX.Dictionary.Dictionaryitems.commitChanges();
    	   			if(callback) {
    	   				callback();
    	   			}
    	   		} catch(e) {
    	   			Ext.Msg.alert('Error loading Process Dictionary :\n' + e);
    	   		}
            }.bind(this),
            failure: function(){
            	Ext.Msg.alert('Error loading Process Dictionary.');
            },
            params: {
            	action: 'load',
            	profile: ORYX.PROFILE,
            	uuid : ORYX.UUID
            }
        });
	},
	showDictionary : function() {
    	var itemDeleter = new Extensive.grid.ItemDeleter();
    	var gridId = Ext.id();
    	
//    	var dictionaryPaging = new Ext.PagingToolbar({
//    	    pageSize: 10,
//    	    store: Dictionaryitems,
//    	    displayInfo: true,
//    	    displayMsg: 'Entry {0} - {1} of {2}',
//    	    emptyMsg: 'No entries to display'
//    	});
    	
    	var grid = new Ext.grid.EditorGridPanel({
            store: ORYX.Dictionary.Dictionaryitems,
            id: gridId,
            stripeRows: true,
            //bbar: dictionaryPaging,
            cm: new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(), {
            	id: 'name',
                header: 'Name',
                width: 100,
                dataIndex: 'name',
                editor: new Ext.form.TextField({ allowBlank: false })
            }, {
            	id: 'aliases',
                header: 'Aliases',
                width: 100,
                dataIndex: 'aliases',
                editor: new Ext.form.TextField({ allowBlank: true })
            }, {
            	id: 'description',
                header: 'Description',
                width: 100,
                dataIndex: 'description',
                editor: new Ext.form.TextField({ allowBlank: true })
            }, 
            itemDeleter]),
    		selModel: itemDeleter,
            autoHeight: true,
            tbar: [{
                text: 'Add New Entry',
                handler : function(){
                	ORYX.Dictionary.Dictionaryitems.add(new ORYX.Dictionary.DictionaryDef({
                        name: '',
                        aliases: '',
                        description: ''
                    }));
                    grid.fireEvent('cellclick', grid, ORYX.Dictionary.Dictionaryitems.getCount()-1, 1, null);
                }
            }],
            clicksToEdit: 1
        });
    	
    	var processJSON = ORYX.EDITOR.getSerializedJSON();
    	var processDocumentation = jsonPath(processJSON.evalJSON(), "$.properties.documentation");
    	var docText = "";
    	if(processDocumentation && processDocumentation[0].length > 0) {
    		docText = processDocumentation[0];
    	} else {
    		docText = "No process documentation specified.";
    	}
    	
    	var extractFromDocsButton = new Ext.Button({
    		text: 'Process Documentation',
    	    handler: function(){ 
    	    	Ext.getCmp('processdocs').setValue(docText);
    	    }
    	});

    	var extractImportFormFromDocs = new Ext.form.FormPanel({
    			title: '<center>From Documentation</center>',
    			bodyStyle:'padding:5px',
    			autoScroll: false,
    			height: 60,
    	        items: [extractFromDocsButton],
    	        layoutConfig: {
                    padding:'5',
                    align:'middle'
                }
    	});
    	
    	var extractImportFormFromFile = new Ext.form.FormPanel({
    		baseCls: 'x-plain',
    		labelWidth: 50,
    		defaultType: 'textfield',
			autoScroll: false,
	        items: [
	        {
	            fieldLabel: 'Select',
	            name: 		'subject',
				inputType : 'file',
				style : 	'margin-bottom:10px;display:block;width:100px',
				itemCls :	'ext_specific_window_overflow'
	        }
	        ]
    	});
    	
    	var extractImportFormFromDocsWrapper = new Ext.form.FormPanel({
			title: '<center>From File</center>',
			bodyStyle:'padding:5px',
			autoScroll: false,
			height: 60,
	        items: [extractImportFormFromFile],
	        layoutConfig: {
                padding:'5',
                align:'middle'
            }
	});
    	
    	var dictionaryInnerPanel = new Ext.Panel({
    		header: false,
    		width: '100%',
    	    layout:'column',
    	    border : false,
    	    layoutConfig: {
    			columns: 2,
    			pack:'center',
    		    align:'middle'
    		},
    	    items: [
    	            {
    	              columnWidth: .3,
    	              items: extractImportFormFromDocs
    	            },{
    	              columnWidth: .7,
    	              items: extractImportFormFromDocsWrapper
    	            }
    	          ]
    	});
    	
    	var textPannel = new Ext.Panel({
    		title: '<center>Highlight text and click on "Add"</center>',
    		width: '100%',
    		height: 350,
    	    layout:'column',
    	    autoScroll:false,
    	    bodyStyle:'padding:5px',
    	    items:[
    		       {
    		    	    id: 'processdocs',
    		            xtype: 'textarea',
    		            hideLabel: true,
    		            name: 'processtextbox',
    			        grow: false,
    	                width: '100%',
    	                height: 280,
    	                preventScrollbars: false,
    	                style:{overflow:'auto'}
    		        }
                  ],
            tbar: [{
            	text: 'Add',
                handler : function(){
                	var e = document.getElementById('processdocs'); 
                    var selected = e.value.substring(e.selectionStart, e.selectionEnd);
                	if(selected && selected.length > 0) {
                		ORYX.Dictionary.Dictionaryitems.add(new ORYX.Dictionary.DictionaryDef({
                            name: selected,
                            aliases: '',
                            description: ''
                        }));
                	}
                  }
                  }]
    	});
    	
    	var extractionPanel = new Ext.Panel({
    		id: 'processdocspanel',
    		title: '<center>Extract Dictionary entries</center>',
    		layout:'column',
    		items:[
    		       dictionaryInnerPanel,textPannel
                  ],
    		layoutConfig: {
    			columns: 1
    		},
    		defaults: {
    	        columnWidth: 1.0
    	    }
    	});
    	
    	var dictionaryOutterPanel = new Ext.Panel({
    		header: false,
    	    layout:'column',
    	    items: [
    	            {
    	              columnWidth: .4,
    	              items: grid
    	            },{
    	              columnWidth: .6,
    	              items: extractionPanel
    	            }
    	          ]
    	});
    	
		var dialog = new Ext.Window({ 
			layout		: 'anchor',
			autoCreate	: true, 
			title		: 'Process Dictionary Editor', 
			height		: 530, 
			width		: 960, 
			modal		: true,
			collapsible	: false,
			fixedcenter	: true, 
			shadow		: true, 
			resizable   : true,
			proxyDrag	: true,
			autoScroll  : true,
			keys:[{
				key	: 27,
				fn	: function(){
						dialog.hide()
				}.bind(this)
			}],
			items		:[dictionaryOutterPanel],
			listeners	:{
				hide: function(){
					dialog.destroy();
				}.bind(this)				
			},
			buttons		: [{
                text: 'Save',
                handler: function(){
                	// commit locally
                	ORYX.Dictionary.Dictionaryitems.commitChanges();
                	// store server-side
                	var datar = new Array();
                    var jsonDataEncode = "";
                    var records = ORYX.Dictionary.Dictionaryitems.getRange();
                    for (var i = 0; i < records.length; i++) {
                        datar.push(records[i].data);
                    }
                    jsonDataEncode = Ext.util.JSON.encode(datar);
                    var saveLoadMask = new Ext.LoadMask(Ext.getBody(), {msg:'Storing Process Dictionary'});
                    saveLoadMask.show();
                    Ext.Ajax.request({
        	            url: ORYX.PATH + 'dictionary',
        	            method: 'POST',
        	            success: function(request) {
        	    	   		try {
        	    	   			saveLoadMask.hide();
        	    	   			dialog.hide();
        	    	   		} catch(e) {
        	    	   			Ext.Msg.alert('Error saving Process Dictionary :\n' + e);
        	    	   		}
        	            }.createDelegate(this),
        	            failure: function(){
        	            	Ext.Msg.alert('Error saving Process Dictionary');
        	            },
        	            params: {
        	            	action: 'save',
        	            	profile: ORYX.PROFILE,
        	            	uuid : ORYX.UUID,
        	            	dvalue : jsonDataEncode
        	            }
        	        });
                }.bind(this)
            }, {
                text: 'Cancel',
                handler: function(){
                	dialog.hide()
                }.bind(this)
            }]
		});		
				
		dialog.show();		
		grid.render();
		grid.focus( false, 100 );
		
		extractImportFormFromFile.items.items[0].getEl().dom.addEventListener('change',function(evt){
			var reader = new FileReader();
			reader.onload = function(e) { 
				Ext.getCmp('processdocs').setValue( e.target.result );
			} 
			reader.readAsText(evt.target.files[0], 'UTF-8');
		}, true);
	},
	_tobr: function(str) {
        return str.replace(/(\r\n|[\r\n])/g, "<br />");
    }
});

