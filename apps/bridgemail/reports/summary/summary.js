/* 
 * Name: Summary View
 * Date: 15 March 2014
 * Author: Pir Abdul Wakeel
 * Description: Main Summary View, Pass An arugment from Campaigns page(campNum), then Fetch stats and campaign summary
 *              When All Stats fetch then call goes for campaign summary and parallel contacts loading. chart loading, links loading.
 * Dependency: HTML, Summary Model, Graphs View, Stats Model, Contacts VIew.
 */

define(['text!reports/summary/html/summary.html','reports/summary/models/summary','reports/summary/views/links','reports/summary/views/graphs','reports/summary/models/stats','reports/summary/views/scontacts'],
function (template,Summary,ViewLinks,ViewGraphs,Stats,contactsView) {
        'use strict';
        return Backbone.View.extend({
            className: 'campaign-summary',
            events: {
                "click .c-refresh":"render",
                "click .scroll-summary":"scrollToTop",
                "click .c-settings":"campaignSetting",
                "click .page-views":"pageViews",
                "click .click-views":"clickViews",
                "click .convert-views":"convertViews",
                "click .open-views":"openViews",
                "click .closebtn":"closeContactsListing"
            },
            initialize: function () {
               this.template = _.template(template);				
               this.campNum = this.options.params.camp_id;
               this.active_ws = "";
               this.type="basic";
               this.stats = new Stats();
               this.objSummary = new Summary();
               this.render();
            },
            render: function () {
                this.options.app.showLoading('Loading Campaign....',this.$el);
                this.fetchStats();
                this.options.app.showLoading(false,this.$el);
                this.active_ws = this.$el.parents(".ws-content");
                $(window).scroll(_.bind(this.scrollTop,this));
                $(window).resize(_.bind(this.scrollTop,this));
            },
            addLinks:function(){
               this.$el.find('.links-container').prepend(new ViewLinks({clickCount:this.stats.get('clickCount'),app:this.options.app,campNum:this.campNum}).el);  
                this.options.app.showLoading(false,this.$el.find('.links-container'));
            },
            addGraphs:function(self){
                self.$el.find('.col-cstats').prepend(new ViewGraphs({clicks:this.stats.get('clickCount'),model:self.stats,tags:self.objSummary.get('tags'),status:self.objSummary.get('status'),app:self.options.app,campNum:self.campNum}).el);  
                this.options.app.showLoading(false,this.$el.find('.col-cstats'));
            },
            fetchStats:function(){
                var _data = {};
                var self = this;
                _data['type'] =  "stats";
                _data['isSummary'] = "Y";
                _data['campNums'] = this.campNum;
                 self.options.app.showLoading('Loading Links....',self.$el.find('.links-container'));
                    self.options.app.showLoading('Loading Chart....',self.$el.find('.col-cstats'));
                this.stats.fetch({data:_data,success:function(data){
                    self.$el.html(self.template({stats:data}));
                    var _data = {};
                    _data['type'] = self.type;
                    _data['campNum'] = self.campNum;
                    self.objSummary.fetch({data:_data,success:function(){
                        self.addGraphs(self); 
                        self.setHeader(self);

                    }});
                    self.active_ws = self.$el.parents(".ws-content");
                    self.openViews();
                    self.addLinks();
                 }});
                self.options.app.showLoading(false,self.$el.find('.links-container'));
                self.options.app.showLoading(false,self.$el.find('.col-cstats'));
                
            }
            ,
            getTabbedText:function(tab){
              var numbers = 0;
              switch(tab){
                 case "open":
                    tab = "Opened";
                    numbers = this.stats.get('openCount');
                    break;    
                 case "click":
                     tab = "Clicked";
                    numbers = this.stats.get('clickCount');
                    break;    
                 case "convert":
                     tab = "Conversion";
                    numbers = this.stats.get('conversionCount');
                    break;    
                 case "views":   
                     tab = "Page Views";
                    numbers = this.stats.get('pageViewsCount');
                    break;    
              }
                    var sent = parseInt(this.stats.get('sentCount'));
                    var numbers = parseInt(numbers);

                    var percent =  ((numbers/sent) * 100);
                    percent = Math.ceil(percent);
                    percent = (isNaN(percent = parseInt(percent, 10)) ? 0 : percent)
                    var span = "<span> "+tab+" </span><em>"+percent+"%</em><strong>"+this.options.app.addCommas(numbers)+"</strong>";
                    return span;
            },
            scrollTop:function(){
                 if ($(window).scrollTop()>50) {
                       this.$el.find(".ScrollToTop").fadeIn('slow');
                    } else {
                       this.$el.find(".ScrollToTop").fadeOut('slow');
                 }
            },
            scrollToTop:function(){
                $("html,body").css('height','100%').animate({scrollTop:0},600).css("height","");    
            },
            campaignSetting:function(){
                  var dialog_width = 800;
                  var that = this;
                  var dialog_height = $(document.documentElement).height()-280;
                  var dialog = this.options.app.showDialog(
                        {           
                                    title:'Campaign Settings',
                                    css:{"width":dialog_width+"px","margin-left":"-"+(dialog_width/2)+"px","top":"20px"},
                                    headerEditable:false,
                                    headerIcon : 'setting2',
                                    bodyCss:{"min-height":dialog_height+"px"}                                                                          
                         });
                  that.options.app.showLoading('Loading Campaign Settings....',dialog.getBody());
                  require(["reports/summary/views/settings"],function(Settings){
                         var mPage = new Settings({model:that.objSummary});
                         dialog.getBody().html(mPage.$el);
                         that.options.app.showLoading(false,dialog.getBody());
                   });
                  
            },
            pageViews:function(ev){
                 if($(ev.target).parents('li').hasClass('active')) return;
                 var count = $(ev.target).parents('li').data("count");
                 if(!count){
                  this.active_ws.find(".stats_listing").html("<div class='erow' style='line-height:50px;background:#DCF3FE'> <div style='margin-left:45%;margin-top:20px;margin-bottom:20px;'> No contact found </div></div>");
                     this.closeContactsListing();
                     return;
                }
               
                this.clearHTML();  
                this.active_ws.find(".contacts_listing").html(new contactsView({type:"WV",app:this.options.app,campNum:this.campNum,listing:'page'}).el)
                this.active_ws.find(".contacts_listing").find(".closebtn").remove();
            },
            convertViews:function(ev){
                if($(ev.target).parents('li').hasClass('active')) return;
                 var count = $(ev.target).parents('li').data("count");
                 if(!count){
                  this.active_ws.find(".stats_listing").html("<div class='erow' style='line-height:50px;background:#DCF3FE'> <div style='margin-left:45%;margin-top:20px;margin-bottom:20px;'> No contact found </div></div>");
                     this.closeContactsListing();
                     return;
                }
                this.clearHTML();
               this.active_ws.find(".contacts_listing").html(new contactsView({type:"CT",app:this.options.app,campNum:this.campNum,listing:'page'}).el)
               this.active_ws.find(".contacts_listing").find(".closebtn").remove();
             },
            clickViews:function(ev){
                if($(ev.target).parents('li').hasClass('active')) return;
                var count = $(ev.target).parents('li').data("count");
                 if(!count){
                   this.active_ws.find(".stats_listing").html("<div class='erow' style='line-height:50px;background:#DCF3FE'> <div style='margin-left:45%;margin-top:20px;margin-bottom:20px;'> No contact found </div></div>");
                     this.closeContactsListing();
                     return;
                }
                this.clearHTML();  
                this.active_ws.find(".contacts_listing").html(new contactsView({type:"CK",app:this.options.app,campNum:this.campNum,listing:'page'}).el)
                this.active_ws.find(".contacts_listing").find(".closebtn").remove();
            },
            openViews:function(ev){
                
                if(ev){ 
                    if($(ev.target).parents('li').hasClass('active')) return;
                    var count = $(ev.target).parents('li').data("count");
                    if(!count){
                        this.active_ws.find(".stats_listing").html("<div class='erow' style='line-height:50px;background:#DCF3FE'> <div style='margin-left:45%;margin-top:20px;margin-bottom:20px;'> No contact found </div></div>");
                        this.closeContactsListing();
                        return;
                    }
                  }
                  this.clearHTML();
                  this.active_ws.find(".contacts_listing").html(new contactsView({type:"OP",app:this.options.app,campNum:this.campNum,listing:'page'}).el)
                  this.active_ws.find(".contacts_listing").find(".closebtn").remove();
              
            },
            clearHTML:function(){
                this.closeContactsListing();
                this.$el.find(".stats_listing").empty();
                this.active_ws.find(".stats_listing").hide();
                this.active_ws.find(".stats_listing").show();
                this.active_ws.find(".stats_listing #tblcontacts tbody #loading-tr").remove();
                 
            },
            closeContactsListing:function(){
                this.active_ws.find(".campaign-clickers").empty('');
                this.active_ws.find(".campaign-clickers").hide();
            }
            ,
            setHeader:function(){
                
                var that = this;
                this.active_ws.find(".camp_header .edited  h2").find(".pointy").remove();
                this.active_ws.find(".camp_header").find(".preview").remove();
                
                this.active_ws.find(".sentat").remove();
                this.active_ws.find("#campaign_tags").html('');
                var c_name = this.options.app.encodeHTML(this.objSummary.get('name'));
                var name = this.truncateHeader(c_name);
                this.active_ws.find("#workspace-header").addClass('showtooltip').attr('data-original-title',c_name).html(name);
                //Setting tab details for workspace. 
                 var workspace_id = this.$el.parents(".ws-content").attr("id");
                 this.options.app.mainContainer.setTabDetails({workspace_id:workspace_id,heading:name,subheading:"Campaign Summary"});
                
                var tags ="<ul>";
                            _.each(this.options.app.encodeHTML(this.objSummary.get('tags')).split(","),function(t){ 
                              tags =tags+ "<li><a  class='tag'><span>"+t+"</span></a> </li>";
                            }); 
                    tags=tags+"</ul> ";
                
                var sentAt = "<div class='sentat'> <em>Sent at</em> <strong>"+this.objSummary.get('updationDate')+"</strong> </div>";    
                //this.$el.parents(".ws-content").find(".camp_header").find('.c-name').append(sentAt);
                this.active_ws.find(".camp_header").find("#campaign_tags").addClass("tagscont").css("width","auto").append("<span class='tagicon gray'></span>").append(tags).append(sentAt);
                var previewIconCampaign = $('<a class="icon preview showtooltip" data-original-title="Preview Campaign"></a>');  
                var copyIconCampaign = $('<a class="icon copy showtooltip" data-original-title="Copy Campaign"></a>');
                var deleteIconCampaign = $('<a class="icon delete showtooltip" data-original-title="Delete Campaign"></a>');
                copyIconCampaign.on('click',function(){
                    that.copyCampaign(that.campNum);
                });
                var header_title =this.active_ws.find(".camp_header .edited  h2");
                var action_icon = $('<div class="pointy"></div>")');
                action_icon.append(copyIconCampaign);
                action_icon.append(deleteIconCampaign);
                header_title.append(action_icon); 
                header_title.append(previewIconCampaign); 
                this.active_ws.find(".camp_header .showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
                deleteIconCampaign.click(function(){
                        
                        that.options.app.showAlertDetail({heading:'Confirm Deletion',
                        detail: that.options.app.messages[0].CAMPS_delete_confirm_error,                                                
                        callback: _.bind(function(){
                                that.$el.parents(".ws-content").find(".overlay").remove();
                                that.deleteCampaign(that.campNum);
                        },that)},
                        that.$el.parents(".ws-content"));
                      //}
                });
                
                 previewIconCampaign.click(function(e){
                       //active_ws.find(".camp_header .c-name h2,#campaign_tags").hide();
                       var camp_name = that.active_ws.find("#workspace-header").html();                                                
                        var dialog_width = $(document.documentElement).width()-60;
                        var dialog_height = $(document.documentElement).height()-182;
                        var dialog = that.options.app.showDialog({title:'Campaign Preview of &quot;'+ camp_name +'&quot;',
                                  css:{"width":dialog_width+"px","margin-left":"-"+(dialog_width/2)+"px","top":"10px"},
                                  headerEditable:false,
                                  headerIcon : 'dlgpreview',
                                  bodyCss:{"min-height":dialog_height+"px"},
                                  buttons: {saveBtn:{text:'Email Preview',btnicon:'copycamp'} }
                        });
                        var preview_url = "https://"+that.options.app.get("preview_domain")+"/pms/events/viewcamp.jsp?cnum="+that.campNum+"&html=Y&original=N";                                                            
                        var preview_iframe = $("<iframe class=\"email-iframe\" style=\"height:"+dialog_height+"px\" frameborder=\"0\" src=\""+preview_url+"\"></iframe>");                            
                        dialog.getBody().html(preview_iframe);               
                        dialog.saveCallBack(_.bind(that.sendTextPreview,that,that.campNum));                        
                        e.stopPropagation();     
                  })
                
            },
              sendTextPreview:function(){
                    var camp_obj = this;
                    var dialog_width = 650;
                    var dialog_height = 100;
                    var dialog = camp_obj.options.app.showDialog({title:'Email Preview' ,
                            css:{"width":dialog_width+"px","margin-left":"-"+(dialog_width/2)+"px","top":"20%"},
                            headerEditable:false,
                            headerIcon : 'copycamp',
                            bodyCss:{"min-height":dialog_height+"px"},
                            buttons: {saveBtn:{text:'Send',btnicon:'copycamp'} }
                    });	
                    var email_preview ='<div style=" min-height:100px;"  class="clearfix template-container gray-panel" id="create-template-container">';
                        email_preview +='<div class="cont-box" style="margin-top:10px; top:0; left:56%; width:90%;">';
                        email_preview +='<div class="row campname-container">';
                        email_preview +='<label style="width:10%;">To:</label>';
                        email_preview +='<div class="inputcont" style="text-align:right;">';
                        email_preview +='<input type="text" name="_email" id="send_email" placeholder="Enter comma separated email addresses" style="width:83%;" />';
                        email_preview +='</div></div></div></div>';
                        email_preview = $(email_preview);                                
                        dialog.getBody().html(email_preview);
                        email_preview.find("#send_email").focus();
                        email_preview.find("#send_email").keydown(_.bind(function(e){
                            if(e.keyCode==13){
                                this.sendTestCampaign(dialog,this.campNum);
                            }
                        },this))
                        dialog.saveCallBack(_.bind(this.sendTestCampaign,this,dialog,this.campNum));
                },
                sendTestCampaign:function(dialog,camp_id){
                    var _this = this;
                    var _emails = dialog.$el.find("#send_email").val();
                    if(_emails){
                        var post_data = {toEmails:_emails};                            
                        this.options.app.showLoading("Sending Email...",dialog.$el);
                        var _this = this;
                        var URL = "/pms/io/campaign/saveCampaignData/?BMS_REQ_TK="+this.options.app.get('bms_token')+"&campNum="+_this.campNum+"&type=email";
                        $.post(URL, post_data)
                        .done(function(data) {                                 
                               var _json = jQuery.parseJSON(data);                         
                               _this.options.app.showLoading(false,dialog.$el);          
                               if(_json[0]!=="err"){
                                   dialog.hide();
                                   _this.app.options.showMessge("Email sent successfully!");  
                               }
                               else{
                                   _this.app.options.showAlert(_json[1],$("body"),{fixed:true}); 
                               }
                       });
                   }
                },
                 deleteCampaign: function(camp_id) {
                        var camp_obj = this;
                        var active_ws = this.$el.parents(".ws-content");
                        var URL = '/pms/io/campaign/saveCampaignData/?BMS_REQ_TK='+camp_obj.options.app.get('bms_token');
                        camp_obj.options.app.showLoading("Deleting Campaign...",camp_obj.$el.parents(".ws-content"));
                        $.post(URL, {type:'delete',campNum:this.campNum})
                        .done(function(data) {                                 
                                   var del_camp_json = jQuery.parseJSON(data);  
                                   if(camp_obj.options.app.checkError(del_camp_json)){
                                                  return false;
                                   }
                                   if(del_camp_json[0]!=="err"){
                                           camp_obj.options.app.showMessge("Campaign Deleted");
                                           active_ws.find(".camp_header  .close-wp").click();
                                   }
                                   camp_obj.options.app.showLoading(false,camp_obj.$el.parents(".ws-content"));
                   });
		 },
                 copyCampaign: function(camp_id)
			{
                            var camp_obj = this;
                            var dialog_title = "Copy Campaign";
                            var dialog = this.options.app.showDialog({title:dialog_title,
                                              css:{"width":"600px","margin-left":"-300px"},
                                              bodyCss:{"min-height":"260px"},							   
                                              headerIcon : 'copycamp',
                                              buttons: {saveBtn:{text:'Create Campaign'} }                                                                           
                            });
                            this.options.app.showLoading("Loading...",dialog.getBody());
                            require(["copycampaign"],function(copycampaignPage){                                     
                                             var mPage = new copycampaignPage({camp:camp_obj,camp_id:camp_id,app:camp_obj.options.app,copycampsdialog:dialog});
                                             dialog.getBody().html(mPage.$el);
                                             dialog.saveCallBack(_.bind(mPage.copyCampaign,mPage));
                            });
			},
                        truncateHeader:function(header){
                             
                            if(header.length > 47) 
                            return header.substring(0,47)+ '...';
                            else return header;
                        },

            
        });    
});