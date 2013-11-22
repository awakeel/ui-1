define(['jquery', 'underscore', 'backbone','text!templates/common/dialog.html'],
	function ($,_,Backbone, template) {
		'use strict';
		return Backbone.View.extend({			
                        className:'modal',
                        events: {
                            'click .btn-save':function(){
                                this.saveCall()
                            }
                         },
			initialize: function () {
				this.template = _.template(template);				
				this.render();
			},
			render: function () {
                             this.$el.html(this.template({}));              
                                                          
                             this.$el.css(this.options.css ? this.options.css:{});
                             this.$(".dialog-title").html(this.options.title?this.options.title:'Makesbridge');                             
                             this.$(".modal-body").css(this.options.bodyCss ? this.options.bodyCss:{});
                             if(this.options.buttons){
                                if(this.options.buttons.saveBtn){ 
                                    this.$(".modal-footer .btn-save").show();
                                    if(this.options.buttons.saveBtn.text){
                                        this.$(".modal-footer .btn-save").html(this.options.buttons.saveBtn.text);
                                    }
                                }
                                if(this.options.buttons.closeBtn){
                                    if(this.options.buttons.saveButtn.text){
                                        this.$(".modal-footer .btn-close").html(this.options.buttons.closeBtn.text);
                                    }
                                }
                             }
			},                        
                        show:function(){                          
                          this.$el.modal({backdrop: 'static',keyboard: false});
                          this.$el.modal("show");
                          this.$el.on('hidden', _.bind(function(){
                            this.$el.remove();                          
                          },this))
                          
                        },
                        hide:function(){
                            this.$el.modal("hide");
                        },
                        getBody:function(){
                            return this.$(".modal-body");
                        },
                        saveCallBack:function(save){
                            this.saveCall = save;
                        }
		});
	});