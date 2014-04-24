define(['text!campaigns/html/campaign_row_copy.html','jquery.highlight'],
function (template,highlighter) {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        // Subscriber Record View to show on listing page
        //
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        'use strict';
        return Backbone.View.extend({
            className: 'copy-campaign-box',
            tagName:'tr',
            
            /**
             * Attach events on elements in view.
            */
            events: {
               'click .btn-copy':'copyCampaign',
               //'click .btn-gray':'openCampaign',
               'click .taglink':'tagClick',
               'click .report':'reportShow',
            },
            /**
             * Initialize view - backbone
            */
            initialize: function () {
                    this.template = _.template(template);				
                    this.sub = this.options.sub; // Campaign View
                    this.app = this.sub.app; 
                    this.parent = this.options.parent;
                    this.tagTxt = '';
                    this.render();
                    //this.model.on('change',this.renderRow,this);
            },
              /**
             * Render view on page.
            */
            render: function () {                    
                
               this.$el.html(this.template({
                    model: this.model
                }));
                this.$(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
                this.initControls();  
               
            },
            /*
             * 
             * @returns Campaign Status
             */
            getCampStatus:function(){
                
                var value = this.app.getCampStatus(this.model.get('status'));
                var tooltipMsg = '';
                if(this.model.get('status') == 'D' || this.model.get('status') == 'S')
				{
					tooltipMsg = "Click to edit";
				}
				else 
				{
					tooltipMsg = "Click to preview";
				}
                  return {status:value,tooltip:tooltipMsg}
            },
            /*
             * 
             * @returns Time Show
             */
            getTimeShow :function(){
                                var datetime = '';
				var dtHead = '';
                                var dateFormat = '';
				if(this.model.get('status') != 'D')
				{
					dtHead = 'Schedule Date';
					datetime = this.model.get('scheduledDate');
				}
                                else {
                                    dtHead = 'Updation Date';
                                    if(this.model.get('updationDate'))
                                            datetime = this.model.get('updationDate');
                                    else
                                            datetime = this.model.get('creationDate');
                                }
                             if(datetime)
				{
					var date = moment(this.app.decodeHTML(datetime),'YYYY-M-D H:m');														
					dateFormat = date.format("DD MMM, YYYY");
                                        if(this.model.get('status') == 'S' || this.model.get('status') =='P'){
                                            dateFormat = date.format("DD MMM, YYYY<br/>hh:mm A");
                                        }
				}
				else{
					dateFormat = '03 Sep, 2013';					
                                     }
                       return {dtHead:dtHead,dateTime:dateFormat}
            },          
            /**
             * Draw Buttons 
            */
            drawButtons:function(){  
				var btns = '<a  class="btn-green btn-copy"><span>Copy</span><i class="icon copy"></i></a>';
				return btns;
            },
            /**
             * Initializing all controls here which need to show in view.
            */
            initControls:function(){
                if(this.parent.searchTxt){
                    this.$(".show-detail").highlight($.trim(this.parent.searchTxt));
                    this.$(".taglink").highlight($.trim(this.parent.searchTxt));
                }else{
                    this.$(".taglink").highlight($.trim(this.parent.tagTxt));
                }    
            },
            openCampaign:function(){
               var camp_id = this.model.get('campNum.encode');
               var camp_wsid = this.model.get('campNum.checksum');
               this.app.mainContainer.openCampaign(camp_id,camp_wsid);
            },
            copyCampaign: function()
			{
                          
                    this.sub.setEditor();
                    //var target = $.getObj(obj,"div");
                    var camp_id = this.model.get('campNum.encode');
                    var bms_token =this.app.get('bms_token');
                    this.sub.states.editor_change = true;
                    this.app.showLoading('Loading HTML...',this.sub.$el);
                    var URL = "/pms/io/campaign/getCampaignData/?BMS_REQ_TK="+bms_token+"&campNum="+camp_id+"&type=basic";                    
                    jQuery.getJSON(URL,_.bind(function(tsv, state, xhr){
                       var callBack = this.sub.setEditorHTML(tsv, state,xhr);
                    },this));
                    this.sub.$("#html_editor").click();
               
			},
            getFlagClass:function(){
                var flag_class = '';
                var chartIcon = '';
                
				if(this.model.get('status') == 'D')
					flag_class = 'pclr1';
				else if(this.model.get('status') == 'P')
					flag_class = 'pclr6';
				else if(this.model.get('status') == 'S')
					flag_class = 'pclr2';
				else if(this.model.get('status') == 'C')
					flag_class = 'pclr18';
                                else
                                        flag_class = 'pclr1';
                                    if(this.model.get('status') == 'P' || this.model.get('status') == 'C')
				{
					chartIcon = '<div class="campaign_stats showtooltip" title="Click to View Chart"><a class="icon report"></a></div>';
				}
				
                 return {flag_class:flag_class,chartIcon:chartIcon};
                 
            },

                        tagClick:function(obj){
                            this.parent.taglinkVal = true;
                            //this.tagTxt = obj.currentTarget.text;
                            this.app.initSearch(obj,this.parent.$el.find("#copy-camp-search"));
                        },
                        reportShow:function(){
                                        var camp_id=this.model.get('campNum.encode');
                                        this.app.mainContainer.addWorkSpace({params: {camp_id: camp_id},type:'',title:'Loading...',url:'reports/summary/summary',workspace_id: 'summary_'+camp_id,tab_icon:'campaign-summary-icon'});
                        }
            
        });
});