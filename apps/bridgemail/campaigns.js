define(['jquery.bmsgrid','jquery.highlight','text!html/campaigns.html'],
function (bmsgrid,jqhighlight,template) {
        'use strict';
        return Backbone.View.extend({
			id: 'campaigns_list',
			tags : 'div',
			events: {				
				"click #addnew_campaign":function(){					
                                    this.app.mainContainer.openCampaign();
				},
                                "click #list_grid .btn-green":function(obj){
                                    var target = $.getObj(obj,"a");
                                    if(target.attr("id")){
                                        this.app.mainContainer.openCampaign(target.attr("id"));
                                    }
                                },
				 'keyup #list-search':function(obj){
					 var searchterm = $(obj.target).val();
					 if(searchterm.length){
						 this.$("#remove-search-list").show();
						 this.$("#remove-merge-list").show();
						 this.$("#list_grid tr").hide();
						 this.$('#no_of_camps').hide();
						 this.$('#srch').hide();
						 searchterm = searchterm.toLowerCase();
						 this.$("#list_grid tr").filter(function() {                                   
							  return $(this).text().toLowerCase().indexOf(searchterm) > -1;
						  }).show();
						  this.$('#list_grid').removeHighlight().highlight(searchterm);
					 }
					 else{
						 this.$("#remove-search-list").hide();
						 this.$("#remove-merge-list").hide();
						 this.$("#list_grid tr").show();
						 this.$('#no_of_camps').show();
						 this.$('#srch').show();
						 this.$("#list_grid").removeHighlight();
					 }
												
					 
				 },
				 'click #remove-merge-list':function(){
				   this.$("#list-search").val('');  
				   this.$("#remove-search-list").hide();
				   this.$("#remove-merge-list").hide();
				   this.$("#list_grid tr").show();
				   this.$('#no_of_camps').show();
				   this.$('#srch').show();
				   this.$("#list_grid").removeHighlight();
				 }				
			},
			initialize:function(){
			   this.template = _.template(template);
			   $('.tagscont').hide();
			   this.render();
			},
			render: function () {
				this.$el.html(this.template({}));
                                this.app = this.options.app;    
				this.getallcampaigns();
			}
                        ,
                        init:function(){
                            this.$(".template-container").css("min-height",(this.app.get('wp_height')-178));
                        }
			,
			getallcampaigns: function () {
				var camp_obj = this;                                
				this.app.showLoading(true,camp_obj.$el.find("#target-camps"));
				URL = "/pms/io/campaign/getCampaignData/?BMS_REQ_TK="+this.app.get('bms_token')+"&type=listNormal";
				jQuery.getJSON(URL,  function(tsv, state, xhr){					
					if(xhr && xhr.responseText){
						camp_obj.createListTable(xhr);
					}
				}).fail(function() { console.log( "error lists listing" ); });
			}
			,
			createListTable: function (xhr) {
				var camp_obj = this;				
				var camp_list_json = jQuery.parseJSON(xhr.responseText);
				var list_html = '<table cellpadding="0" cellspacing="0" width="100%" id="list_grid"><tbody>';				
				$.each(camp_list_json.lists[0], function(index, val) {
					list_html += camp_obj.makecamprows(val);					
				});	
                                
				list_html += '</tbody></table>';
				this.app.showLoading(false,camp_obj.$el.find("#target-camps"));
				this.$el.find("#target-camps").html(list_html);
				this.$el.find("#list_grid").bmsgrid({
						useRp : false,
						resizable:false,
						colresize:false,
						height:this.app.get('wp_height')-178,
						usepager : false,
						colWidth : ['100%','90px','66px','132px']
				});                                                                
                                this.$("#list_grid tr td:nth-child(1)").attr("width","100%");
                                this.$("#list_grid tr td:nth-child(2)").attr("width","90px");
                                this.$("#list_grid tr td:nth-child(3)").attr("width","66px");
                                this.$("#list_grid tr td:nth-child(4)").attr("width","132px");
				var camp_count_lable = '';
				if(camp_list_json.count > 1)
					camp_count_lable = 'Campaigns';
				else
					camp_count_lable = 'Campaign';				
				this.$el.find("span#no_of_camps").html(camp_list_json.count+' '+camp_count_lable);				
			}
			,
			makecamprows: function (val){
				var camp_obj = this;
				var row_html = '<tr id="row_'+val[0].campNum+'">';
				row_html += '<td><div class="name-type"><h3>'+ val[0].name +'</h3>   <div class="  tags"><h5>Tags:</h5>'+ this.app.showTags(val[0].tags) +'</div></div></td>';
				var datetime = val[0].scheduledDate;
				if(datetime)
				{
					var date = datetime.split(' ');
					var dateparts = date[0].split('-');
					 var monthNames = [
					  "Jan", "Feb", "Mar",
					  "Apr", "May", "Jun",
					  "Jul", "Aug", "Sep",
					  "Oct", "Nov", "Dec"
					  ];
					var month = monthNames[dateparts[1].replace('0','')-1];
					var dateFormat = dateparts[2] + ' ' + month + ', ' + dateparts[0];
				}
				else{
					dateFormat = '';					
                                     }   
				row_html += '<td><div class="subscribers show" style="width:60px"><span class=""></span>0</div></td>';
				row_html += '<td><div class="mail show" style="width:40px"><span class=""></span>'+ val[0].sentCount +'</div></td>';
				row_html += '<td><div class="time show" style="width:105px"><span class=""></span>'+ dateFormat +'</div><div id="'+ val[0].campNum +'" class="action"><a id="'+ val[0].campNum +'" class="btn-green">Select</a></div></td>';					
				row_html += '</tr>';
				return row_html;
			}
                       
		});
});