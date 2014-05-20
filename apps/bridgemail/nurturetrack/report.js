define(['text!nurturetrack/html/report.html','nurturetrack/collections/states','nurturetrack/state_row','jquery.bmsgrid'],
function (template,NTStates,stateView) {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        // Report view for Nurture track
        //
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        'use strict';
        return Backbone.View.extend({            
            tagName: 'div',
            /**
             * Attach events on elements in view.
            */
            events: {
               
            },
            /**
             * Initialize view - backbone
            */
            initialize: function () {
                    this.statesRequest = new NTStates();    
                    this.template = _.template(template);				
                    this.parent = this.options.page;                    
                    this.app = this.parent.app;      
                    this.model = this.options.model;
                    this.statDiv = this.options.stateDiv;
                    this.offset = 0;
                    this.render();                    
            },
            /**
             * Render view on page.
            */
            render: function () {                  
                this.$el.html(this.template({
                    model: this.model
                }));                
                          
                          
            },
            init:function(){
                 this.$("#nt_report_table").bmsgrid({
                    useRp : false,
                    resizable:false,
                    colresize:false,
                    height:266,
                    usepager : false,
                    colWidth : ['100%','90px','90px','90px']
                });
                this.loadStates();
            },
            loadStates:function(){
                this.offset = 0;
                this.app.showLoading('Loading states...',this.$el); 
                var _data = {offset:this.offset,type:'stats',trackId:this.model.get("trackId.encode")};
                this.tracks_request = this.statesRequest.fetch({data:_data,remove:true,
                    success: _.bind(function (collection, response) {                                
                        // Display items
                        if(this.app.checkError(response)){
                            return false;
                        }
                        this.app.showLoading(false,this.$el);                                                                         

                        //this.$contactLoading.hide();
                        var sentCount=0,pendingCount =0;
                        for(var s=this.offset;s<collection.length;s++){
                            var _model = collection.at(s);
                            var state_view = new stateView({ model: _model,sub:this });                                                            
                            this.$("#nt_report_table").append(state_view.$el);                                                    
                            sentCount = sentCount + parseInt(_model.get("sentCount"));
                            pendingCount = pendingCount + parseInt(_model.get("pendingCount"));
                        }                                                                        
                       // this.statDiv.find(".sent-count").html(this.app.addCommas(sentCount.toString()));
                       // this.statDiv.find(".pending-count").html(this.app.addCommas(pendingCount.toString()));                        
                    }, this),
                    error: function (collection, resp) {
                            
                    }
                });
            }
            
            
        });
});