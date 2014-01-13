define(['text!html/copycampaign.html'],
function (template) {
        'use strict';
        return Backbone.View.extend({                
                events: {
                    
                 },
                initialize: function () {
                        this.template = _.template(template);				
                        this.render();
						var app = this.options.app;
						var copydialog = this.options.copycampdialog;
						var curview = this;
						this.app.showLoading(false,copydialog.getBody());
						var URL = '/pms/io/campaign/getCampaignData/?BMS_REQ_TK='+app.get('bms_token');
						var camps_json = '';
						$.post(URL, {type:'basic',campNum:this.options.camp_id})
						.done(function(data) {      
							camps_json = jQuery.parseJSON(data);
							curview.$el.find('.copy_campbox h2 span').html(camps_json.name);
							curview.$el.find('.copy_campbox .tagscont').html(app.showTags(camps_json.tags));
						});						
                },

                render: function () {                        						
					this.$el.html(this.template({}));
					this.app = this.options.app;
                },
				copyCampaign: function()
				{
					var camp_id = this.options.camp_id;
					var curview = this;
					var copydialog = this.options.copycampdialog;
					var campview = this.options.camp;
					var app = this.options.app;
					var el = curview.$el;
					var appMsgs = app.messages[0];
					if(el.find('#camp_name').val() == '')
					{						
						app.showError({
							control:el.find('.campname-container'),
							message:appMsgs.CAMPS_campname_empty_error
						});
					}
					else
					{
						var URL = "/pms/io/campaign/saveCampaignData/?BMS_REQ_TK="+app.get('bms_token')+"&type=clone";
						app.showLoading("Creating copy of campaign...",curview.$el);
						$.post(URL, { campNum: camp_id,campName: curview.$el.find('#camp_name').val()})
						.done(function(data) 
						{
							app.showLoading(false,curview.$el);
							var res = jQuery.parseJSON(data);
							if(res[0] == 'err')
								app.showAlert(res[1].replace('&#58;',':'),curview.$el);
							else
							{
								copydialog.hide();
								app.removeCache("campaigns");
								campview.getallcampaigns();
							}
						});
					}
				}
		});
});