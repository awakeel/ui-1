/* 
 * Name: SContact View
 * Date: 15 March 2014
 * Author: Pir Abdul Wakeel
 * Description: Single Contact View, Display Single Contact 
 * Dependency: SCONTACT HTML
 */

define(['text!reports/summary/html/scontact.html'],
function (template) {
        'use strict';
        return Backbone.View.extend({
            className: 'erow',
            tagName:'tr',
            events: {
              'click .view-profile':"openContact",
              'click .page-view':'loadPageViewsDialog'
            },
            initialize: function () {
                _.bindAll(this, 'getRightText', 'pageClicked');
                 this.template = _.template(template);	
                 this.viewCount = 0;
                 this.type = this.options.type;
                 this.firstOpenDate = ""
                 this.articleTitle = "";
                 this.articleUrl = "";
                 this.clickCount = 0;
                 this.isNurtureTrack = false;
                 this.logTime = "";
                 this.render();
            },
            render: function () {
                 if(this.type == "C" || this.type == "P"){
                  this.isNurtureTrack = true;
                  this.viewCount =   this.model.get('nurtureData')[0].pageViewsCount;  
                  this.logTime =this.model.get('nurtureData')[0].execDate; 
                }else{
                  this.logTime = this.model.get('activityData')[0].logTime;
                  this.viewCount =   this.model.get('activityData')[0].pageViewCount;
                }
                this.$el.html(this.template(this.model.toJSON())); 
               
                this.$(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});  
            },
            openContact:function(){
                this.$el.parents('.modal').find('.close').click();
                this.options.app.mainContainer.openSubscriber(this.model.get('subNum.encode'));
            },
            getRightText:function(){
                var text = "";
                switch(this.options.type){
                    case "UN":
                      text = this.unsubscribe("Unsubscribed on");
                       break;
                    case "SP":
                      text = this.unsubscribe("Suppressed on");
                       break;
                    case "CB":
                      text = this.unsubscribe("Bounced on");
                       break;
                    case "OP":
                        text = this.pageOpened("First opened on");
                        break; 
                    case "CK":
                        if(this.options.article)
                            text = this.pageClicked("First clicked on");
                        else
                            text = this.pageClicked("Clicked on");
                        break;
                    case "CT":
                      text = this.unsubscribe("Converted on");
                       break;
                    case "C":
                          text = this.unsubscribe("Sent on")
                          break;
                    case "P":
                          text = this.unsubscribe("Pending");
                          break;
                       
                }
                return text; 
               
            },
            unsubscribe:function(text){
                var str = "";
                //if(this.options.type == "UN"){
                   // str = str +  "<td width='10%'><div><div class='time show' style='width:155px'><strong><span><em>"+text+"</em>"+this.options.app.dateSetting(this.model.get('creationDate'),"-")+"</span></strong></div></div></td>";;
              //  }
                str = str +  "<td width='10%'><div><div class='time show' style='width:155px'><strong><span><em>"+text+"</em>"+this.options.app.dateSetting(this.model.get('creationDate'),"-")+"</span></strong></div></div></td>";;
                return str;
            },
            pageViews:function(text){
               
                if(this.viewCount !="0"){
                    return "<strong><span><em>"+text+"</em><a class='page-views-modal'><b>"+his.viewCount +"</b></a></span></strong>";
                }else{
                      return "<strong><span><em>"+text+"</em> <b>"+his.viewCount +"</b> </span></strong>";
                    }
            },
            pageOpened:function(text){
                return "<td><div><div class='time show' width='10%'><strong><span><em>"+text+"</em> "+this.options.app.dateSetting(this.logTime,"/")+" </span></strong></div></div></td>";
            },
            pageClicked:function(text){
                     return  "<td width='10%'><div><div class='time show' ><strong><span><em>"+text+"</em> "+this.options.app.dateSetting(this.logTime, "/")+" </span></strong></div></div></td>";
            },
            linkTd:function(){
                if(this.type == "C" || this.type == "P") return;
             if(this.model.get('activityData')[0].articleTitle && !this.options.article){               
                   var html ="<td width='30%'><div><div class='colico link'>";
                   html = html + "<strong><span><em>Link URL</em><a class='showtooltip' data-original-title='"+this.model.get('activityData')[0].articleURL+"' href='"+this.model.get('activityData')[0].articleURL+"' target='_blank'>"+this.truncateURL(this.model.get('activityData')[0].articleTitle)+"</a></span></strong></div></div>";
                   return html;
                 }
            },
            truncateURL:function(url){
                if(url.length > 30) 
                return url = url.substring(0,40);
                else return url;
            },
            pageViewsTd:function(){
                if(this.type == "C" || this.type == "P") return;
                if(this.viewCount){
                    if(this.viewCount !="0"){
                        var encode =this.model.get('subNum.encode');
                    var  html ="<td width='10%'><div><div class='colico pgview'>";
                    html = html + "<strong><span><em>Page Views</em><a><b class='page-view' data-id='"+encode+"'>"+this.viewCount+"</b></a></span></strong></div></div></td>";
                    return html;
                    }else{
                                            var encode =this.model.get('subNum.encode');
                  var  html ="<td width='10%'><div><div class='colico pgview'>";
                   html = html + "<strong><span><em>Page Views</em> <b class='page-view' data-id='"+encode+"'>"+this.viewCount+"</b> </span></strong></div></div></td>";
                   return html;   
                    }
                }
            },
            getFullName:function(){
                var name = this.model.get('firstName') + " " + this.model.get('lastName');
                if(!this.model.get('firstName') || !this.model.get('lastName'))
                    return this.model.get('email');
                else 
                    return name;
            },
            loadPageViewsDialog:function(ev){
                     var dialog_width = 80;
                     var that = this;
                     var url = "";
                     if(!this.options.url){
                        var url = this.model.get('activityData')[0].articleURL;
                        var title = this.model.get('activityData')[0].articleTitle;
                        url = title+'|-.-|'+url;
                     }else{
                         url = this.options.url;
                     }
                     
                     if($(ev.target).html() == "0")return;
                     var dialog_height = $(document.documentElement).height()-200;
                     var dialog = this.options.app.showDialog(
                           {           
                                       title:'Page Views',
                                       css:{"width":dialog_width+"%","margin-left":"-"+(dialog_width/2)+"%","top":"20px"},
                                       headerEditable:false,
                                       headerIcon : 'preview3',
                                       bodyCss:{"min-height":dialog_height+"px"}                                                                          
                            });
                     that.options.app.showLoading('Loading Page Views....',dialog.getBody());
                        var name = that.model.get('firstName');
                        if(!name){
                          name = that.model.get('email'); 
                        }else{
                            name = name + "  " + this.model.get('lastName') ;
                        }
                                 
                        require(["reports/summary/views/pageviews",],function(Views){
                                var mPage = new Views({campNum:that.options.campNum,subNum:$(ev.target).data('id'),encode:that.model.get('subNum.encode'),app:that.options.app,email:name,salestatus:that.model.get('salesStatus'),url:url});
                                dialog.getBody().html(mPage.$el);
                                that.options.app.showLoading(false,dialog.getBody());
                          
                        });
                        
                
            },
            firstLetterUpperCase:function(){
                
             return this.model.get('salesStatus').toLowerCase().replace(/\b[a-z]/g, function(letter) {
                   return letter.toUpperCase();
              });
              
                
            }
        });    
});