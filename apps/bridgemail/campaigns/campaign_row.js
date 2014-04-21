define(['text!campaigns/html/campaign_row.html','jquery.highlight'],
function (template,highlighter) {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        // Subscriber Record View to show on listing page
        //
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        'use strict';
        return Backbone.View.extend({
            className: 'campaign-box',
            tagName:'tr',
            
            /**
             * Attach events on elements in view.
            */
            events: {
               'click .btn-copy':'copyCampaign',
               'click .btn-gray':'openCampaign',
               "click .btn-preview":'previewCampaign',
               'click  a.campname': 'campaignStateOpen',
               "click .btn-schedule, .btn-reschedule":'schOpenCampaign',
               'click .btn-red':'deleteCampaginDialoge',
               'click .taglink':'tagClick',
               'click .report':'reportShow',
               'click .btn-draft':'draftBtnClick',
               'click .cflag':'classFlagClick'
               /*'click .tag':'tagSearch'*/
            },
            /**
             * Initialize view - backbone
            */
            initialize: function () {
                    this.template = _.template(template);				
                    this.sub = this.options.sub
                    this.app = this.sub.app;
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
				if(this.model.get('status') == 'P' || this.model.get('status') == 'S')
				{
					dtHead = 'Schedule Date';
					datetime = this.model.get('scheduledDate');
				}
                                else if(this.model.get('status') == 'C')
				{
					dtHead = 'Sent Date';
					datetime = this.model.get('scheduledDate');
				}
				else if(this.model.get('status') == 'D')
				{
                                    dtHead = 'Last Edited';
                                    if(this.model.get('updationDate'))
                                            datetime = this.model.get('updationDate');
                                    else
                                            datetime = this.model.get('creationDate');
				}  
                                else {
                                    dtHead = 'Last Edited';
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
					dateFormat = '';					
                                     }
                       return {dtHead:dtHead,dateTime:dateFormat}
            },          
            /**
             * Draw Buttons 
            */
            drawButtons:function(){  
                                
				var buttons = '';
				switch(this.model.get('status'))
				{					
					case 'D':
						buttons = 'DL,P,C,S,E';
						break;					
					case 'S':
						buttons += 'DL,P,C,R,DR';
						break;
					case 'C':
						buttons += 'DL,P,C';
						break;
					case 'P':
						buttons += 'P,C';
						break;
                                            default:
                                                buttons = 'DL,P,C,S,E';
                                                break;
				} 
                                var btnsArray = [];
                            	btnsArray["DL"] = '<a class="btn-red"><i class="icon delete"></i></a>';
				btnsArray["P"] = '<a class="btn-blue btn-preview"><span>Preview</span><i class="icon preview3"></i></a>';
				btnsArray["C"] = '<a  class="btn-green btn-copy"><span>Copy</span><i class="icon copy"></i></a>';
				btnsArray["S"] = '<a class="btn-green btn-schedule"><span>Schedule</span><i class="icon time2"></i></a>';
				btnsArray["E"] = '<a class="btn-gray btn-edit"><span>Edit</span><i class="icon edit"></i></a>';
				btnsArray["R"] = '<a  class="btn-green btn-reschedule"><span>Reschedule</span><i class="icon time2"></i></a>';
				btnsArray["DR"] = '<a class="btn-blue btn-draft"><span>Draft</span><i class="icon time2"></i></a>';
				
				buttons = buttons.split(',');
				var btns = '';
				for(var i=0; i<buttons.length; i++)
				{
					btns += btnsArray[buttons[i]];
				}
				return btns;
            },
            /**
             * Initializing all controls here which need to show in view.
            */
            initControls:function(){
                if(this.sub.searchTxt){
                    this.$(".show-detail").highlight($.trim(this.sub.searchTxt));
                    this.$(".tag").highlight($.trim(this.sub.searchTxt));
                }
                
            },
            openCampaign:function(){
               var camp_id = this.model.get('campNum.encode');
               var camp_wsid = this.model.get('campNum.checksum');
               this.app.mainContainer.openCampaign(camp_id,camp_wsid);
            },
            copyCampaign: function()
			{
                            var camp_id = this.model.get('campNum.encode');
                            
                            var dialog_title = "Copy Campaign";
                            var dialog = this.app.showDialog({title:dialog_title,
                                              css:{"width":"600px","margin-left":"-300px"},
                                              bodyCss:{"min-height":"260px"},							   
                                              headerIcon : 'copycamp',
                                              buttons: {saveBtn:{text:'Create Campaign'} }                                                                           
                            });
                            this.app.showLoading("Loading...",dialog.getBody());
                            this.sub.total_fetch = 0;
                           require(["copycampaign"],_.bind(function(copycampaignPage){                                     
                                             var mPage = new copycampaignPage({camp:this.sub,camp_id:camp_id,app:this.app,copycampsdialog:dialog});
                                             dialog.getBody().html(mPage.$el);
                                             dialog.saveCallBack(_.bind(mPage.copyCampaign,mPage));
                            },this));
			},
                        previewCampaign:function(){
                                var camp_id = this.model.get('campNum.encode');
                                var camp_obj = this.sub;
				//var appMsgs = this.app.messages[0];				
				var dialog_width = $(document.documentElement).width()-60;
				var dialog_height = $(document.documentElement).height()-182;
				var dialog = camp_obj.app.showDialog({title:'Campaign Preview of &quot;' + this.model.get('name') + '&quot;' ,
						  css:{"width":dialog_width+"px","margin-left":"-"+(dialog_width/2)+"px","top":"10px"},
						  headerEditable:false,
						  headerIcon : 'dlgpreview',
						  bodyCss:{"min-height":dialog_height+"px"}
				});	
				this.app.showLoading("Loading Campaign HTML...",dialog.getBody());									
                                var preview_url = "https://"+this.app.get("preview_domain")+"/pms/events/viewcamp.jsp?cnum="+camp_id;  
                                require(["common/templatePreview"],_.bind(function(templatePreview){
                                var tmPr =  new templatePreview({frameSrc:preview_url,app:this.app,frameHeight:dialog_height,prevFlag:'C',tempNum:camp_id,isText:'N'}); // isText to Dynamic
                                 dialog.getBody().html(tmPr.$el);
                                 tmPr.init();
                               },this));
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
            campaignStateOpen:function(){
               if(this.model.get('status') == 'D' || this.model.get('status') == 'S')
				{
					this.openCampaign();
				}
				else if(this.model.get('status') == 'C' || this.model.get('status') == 'P')
				{
					this.previewCampaign();
				}
                                else{
                                    this.openCampaign();
                                }
            },
            deleteCampaginDialoge:function(){
                                var camp_obj = this.sub;
                                var appMsgs = camp_obj.app.messages[0];
                                var camp_id = this.model.get('campNum.encode')
                                if(camp_id){
                                        this.app.showAlertDetail({heading:'Confirm Deletion',
                                        detail:appMsgs.CAMPS_delete_confirm_error,                                                
                                        callback: _.bind(function(){
                                                camp_obj.$el.parents(".ws-content.active").find(".overlay").remove();
                                                this.deleteCampaign();
                                        },this)},
                                        camp_obj.$el.parents(".ws-content.active"));
                                            /*$(".overlay .btn-ok").click(function(){
                                                    $(".overlay").remove();
                                               camp_obj.deleteCampaign(target.attr("id"));
                                            });*/
                                }
            },
            deleteCampaign: function()
			{
                            var camp_obj = this.sub;
                            
                            var appMsgs = this.app.messages[0];
                            var URL = '/pms/io/campaign/saveCampaignData/?BMS_REQ_TK='+camp_obj.app.get('bms_token');
                            camp_obj.app.showLoading("Deleting Campaign...",camp_obj.$el.parents(".ws-content.active"));
                            $.post(URL, {type:'delete',campNum:this.model.get('campNum.encode')})
                            .done(_.bind(function(data) {   
                                this.app.showLoading(false,camp_obj.$el.parents(".ws-content.active"));	
                                var del_camp_json = jQuery.parseJSON(data);  
                                /*if(camp_obj.app.checkError(del_camp_json)){
                                               return false;
                                }*/
                                if(del_camp_json[0]!=="err"){
                                        this.app.showMessge(appMsgs.CAMPS_delete_success_msg);
                                        //camp_obj.$el.find("#area_copy_campaign .bmsgrid").remove();
                                        this.app.removeCache("campaigns");
                                        camp_obj.total_fetch = 0;
                                        camp_obj.getallcampaigns();
                                         if($("#wstabs li[workspace_id=campaign_"+this.model.get('campNum.encode')+"]").length){
                                            var wp_id = $("#wstabs li[workspace_id=campaign_"+this.model.get('campNum.encode')+"]").attr('id').split("_")[2];
                                            $("#wp_li_"+wp_id+",#workspace_"+wp_id).remove();
                                       }
                                }
                                else{
                                             camp_obj.app.showAlert(del_camp_json[1],camp_obj.$el.parents(".ws-content.active"));							
                                }
                              				   
                            },this));
			},
                        tagClick:function(obj){
                            this.sub.taglinkVal = true;
                             this.app.initSearch(obj,this.sub.$el.find("#list-search"));
                        },
                        reportShow:function(){
                             
                                        var camp_id=this.model.get('campNum.encode');
                                        this.app.mainContainer.addWorkSpace({params: {camp_id: camp_id},type:'',title:'Loading...',url:'reports/summary/summary',workspace_id: 'summary_'+camp_id,tab_icon:'campaign-summary-icon'});
                                   
                        },
                        draftBtnClick: function(){
                             var camp_obj = this.sub;
                                
                                var camp_id = this.model.get('campNum.encode');
                                var URL = '/pms/io/campaign/saveCampaignData/?BMS_REQ_TK='+this.app.get('bms_token');
                                this.app.showLoading("Changing Campaign to Draft...",camp_obj.$el.parents(".ws-content.active"));
                                var camp_json = '';
                                $.post(URL, {type:'saveStep4',campNum:camp_id,status:'D'})
                                .done(_.bind(function(data) {
                                        this.app.showLoading(false,camp_obj.$el.parents(".ws-content.active"));
                                        camp_json = jQuery.parseJSON(data);
                                        if(camp_json[0] == 'err')
                                        {
                                                this.app.showAlert(camp_json[1],camp_obj.$el.parents(".ws-content.active"));
                                        }
                                        else
                                        {
                                                var appMsgs = this.app.messages[0];
                                                this.app.showMessge(appMsgs.CAMP_draft_success_msg);
                                                camp_obj.total_fetch;
                                                camp_obj.getallcampaigns();
                                                camp_obj.headBadge();
                                                this.app.mainContainer.openCampaign(camp_id);
                                        }
                                },this));
                        },
                        classFlagClick: function(){
                           var camp_status = this.model.get('status');
                           var camp_obj = this.sub;
                           camp_obj.$el.find('.stattype').parent().removeClass('active');;
                             switch(camp_status)
                                {
                                case "C":
                                camp_obj.$el.find('.sent').parent().addClass('active');
                                break;
                                case "P":
                                camp_obj.$el.find('.pending').parent().addClass('active');
                                break;
                                case "S":
                                camp_obj.$el.find('.scheduled').parent().addClass('active');
                                break;
                                case "D":
                                camp_obj.$el.find('.draft').parent().addClass('active');
                                break;
                                } 
                           camp_obj.status = camp_status;
                           camp_obj.total_fetch = 0;
                           camp_obj.getallcampaigns();
                        },
                        schOpenCampaign:function(ev){
                            var schFlag = false;
                            if(this.$(ev.currentTarget).hasClass('btn-reschedule') || this.$(ev.currentTarget).hasClass('btn-schedule')){
                                schFlag = 4;
                            }
                            var camp_id = this.model.get('campNum.encode');
                            var camp_wsid = this.model.get('campNum.checksum');
                            this.app.mainContainer.openCampaign(camp_id,camp_wsid,schFlag);  
                        }
            
        });
});