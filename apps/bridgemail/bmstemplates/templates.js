define(['text!bmstemplates/html/templates.html','jquery.highlight','bmstemplates/collections/templates','bmstemplates/template_row'],
function (template,highlight,templateCollection,templateRowView) {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        // Templates Gallery Page
        //
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        'use strict';
        return Backbone.View.extend({            
            /**
             * Attach events on elements in view.
            */            
            events: {				
                'click .create-tempalte':'createTemplate',
                'click .searchbtn':function(){
                     this.$("#search-template-input").keyup();
                },
                "click .refresh_btn":function(){
                    this.app.addSpinner(this.$el);
                    this.loadTemplates();
                },
                'click #clearsearch':'searchTemplateNameTag',
                "click .sortoption_expand": "toggleSortOption",
                //'click .temp-count':'searchTemplate'
            },
            /**
             * Initialize view - backbone .
            */
            initialize:function(){              
               this.app = this.options.app;           
               this.page = this.options.page; 
               this.template = _.template(template);		
               this.offset = 0;
               this.totalcount = 0;
               this.searchValue = "";
               this.searchString = "";
               this.searchTxt = "";
               this.templates = null;  
               this.totalCount = 0;
               this.scrollElement = this.options.scrollElement ? this.options.scrollElement :$(window);
               this.templateCollection = new templateCollection(); 
               this.getTemplateCall = null;
               //              
               this.render();
            },
            /**
             * Initialize view .
            */
            render: function () {
                
               this.$el.html(this.template({}));               
               this.selectText  = this.options.selectAction?this.options.selectAction:'Select Template';
               this.selectTextClass = this.options.selectTextClass?this.options.selectTextClass:'';
               if(this.options.hideCreateButton){
                   this.$(".iconpointy").hide();
               }
              
            }
            /**
             * Custom init function called after view is completely render in wrokspace.
            */
            ,
            init:function(){                
               this.attachEvents();
               this.getUserType();
               this.loadTemplates();
               this.$(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
            },
            getUserType:function(){
                 var URL = "/pms/io/user/getData/?BMS_REQ_TK="+this.app.get("bms_token")+"&type=isAdmin";
                 jQuery.getJSON(URL,_.bind(function(tsv, state, xhr){
                    var _json = jQuery.parseJSON(xhr.responseText);
                    if(this.app.checkError(_json)){
                          return false;
                    }
                    this.app.set("isAdmin",_json[1])
                
                },this));
            },
            loadTemplateAutoComplete:function(results){
                var templates_array = [];
                var map = {};
                $.each(results.templates[0], function(index, val) { 
                    templates_array.push(val[0].name);//{"name":val[0].name,"tags":val[0].tags});
                    map[val[0].name] = {"name":val[0].name,"tags":val[0].tags};
                });
                this.$("#search-template-input").typeahead({
                       source: templates_array,                            
                       highlighter: function (item) {
                          var regex = new RegExp( '(' + this.query + ')', 'gi' );
                          return item.replace( regex, "<strong>$1</strong>" ) +  "<div><b>Tags:</b> "+map[item].tags.replace( regex, "<strong>$1</strong>" )+"</div>";
                       },
                        matcher: function (item) {
                           if (map[item].name.toLowerCase().indexOf(this.query.trim().toLowerCase()) != -1 || map[item].tags.toLowerCase().indexOf(this.query.trim().toLowerCase()) != -1) {
                               return true;
                           }
                       },
                       items:8,                             
                       minLength:2
                   });
                    //$('#camp_tag_text').typeahead({source: camp_obj.tags_common,items:10})
                },
                attachEvents:function(){                    
                    var camp_obj = this;
                    this.$("#search-popular-tags").click(function(e){
                        e.stopPropagation();
                    });
                    this.$("#search-popular-tags").keyup(_.bind(this.searchTemplateTags,this))
                    this.$("#template_search_menu li").click(_.bind(this.searchTemplate,this));
                    this.$("#template_layout_menu li").click(_.bind(this.searchTemplateLayout,this));
                    this.$("#search-template-input").keyup(_.bind(this.searchTemplateNameTag,this));
                    this.$("#search-template-input").keydown(_.bind(this.searchNameTagVal,this));
                    this.$("#search-text-btn").click(_.bind(this.searchTemplateNameTagFromButton,this));
                    this.$("#remove-template-tag-list").click(function(){
                        $(this).hide();
                         camp_obj.$("#search-popular-input").val('');
                         camp_obj.$("#popular_template_tags li").show();  
                    });
                    
                    this.scrollElement.scroll(_.bind(this.liveLoading,this));
                    this.scrollElement.resize(_.bind(this.liveLoading,this));
                    this.app.scrollingTop({scrollDiv:'window',appendto:this.$el,scrollElement:this.scrollElement});

                },
                
                loadTemplateTags:function(){
                    var camp_obj = this;
                    var URL = "/pms/io/user/getData/?BMS_REQ_TK="+this.app.get('bms_token')+"&type=allTemplateTags";
                    jQuery.getJSON(URL,  function(tsv, state, xhr){
                           if(xhr && xhr.responseText){                                                       
                                var tags_template_json = jQuery.parseJSON(xhr.responseText);                                                                                               
                                if(camp_obj.app.checkError(tags_template_json)){
                                    return false;
                                 }
                                var tags = tags_template_json.tags.split(",");
                                var p_tags_html = "";
                                $.each(tags,function(key,val){
                                    p_tags_html +="<li><a >"+val+"</a></li>";
                                });
                                camp_obj.$("#popular_template_tags").html(p_tags_html);
                                camp_obj.$("#popular_template_tags").click(_.bind(camp_obj.searchTemplateByTags,camp_obj));
                           }
                     }).fail(function() { console.log( "error in loading popular tags for templates" ); });
                },
                searchTemplateLayout:function(obj){
                    var li = $.getObj(obj,"li");
                    if(!li.hasClass("active")){
                         this.$("#search-template-input").val('');
                         this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                  
                         var searchType = "layout";
                         var layout_id = li.find("a").attr("type");
                         this.loadTemplates('search',searchType,{layout_id:layout_id});
                         li.addClass("active");
                    }
                    
                },
                searchNameTagVal:function(obj){
                    var _input = $.getObj(obj,"input");
                    this.searchValue = $.trim(_input.val());
                },
                searchTemplateNameTag:function(obj){
                    var _input = $.getObj(obj,"input");
                    var val = $.trim(_input.val());
                        this.$('#clearsearch').hide();            
                    this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                                          
                    //this.getTemplateCall.abort();
                    var keyCode = this.keyvalid(obj);
                    if(keyCode){
                            if(val!==""){
                                this.$('#clearsearch').show();
                                this.timeout = setTimeout(_.bind(function() {
                                        clearTimeout(this.timeout);
                                        this.loadTemplates('search','nameTag',{text:val});
                                    }, this), 500);
                                this.$('#search-template-input').keydown(_.bind(function() {
                                    clearTimeout(this.timeout);
                                }, this));
                            }
                            else{
                                this.$("#template_search_menu li:first-child").click();
                            }
                      }
                      else
                      {
                          if(val!==""){
                            this.$('#clearsearch').show();
                            }
                      }
                   
                    if(val==""){
                        if(this.searchValue!=val){
                            this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                                          
                            //this.getTemplateCall.abort();
                            if(val!==""){
                                this.loadTemplates();
                            }
                            else{
                                this.$("#template_search_menu li:first-child").click();
                            }
                        }
                    }
                    
                    
                },
                searchTemplateNameTagFromButton:function(){
                    var val = $.trim(this.$("#search-template-input").val());
                    if(val!==""){
                        this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                                                                 
                        this.loadTemplates('search','nameTag',{text:val});
                    }
                },
                searchTemplateTags:function(obj){
                    var input_field = $.getObj(obj,"input");
                    var searchterm = $.trim(input_field.val());
                    if(searchterm!==""){
                        this.$("#popular_template_tags li").hide();                                                                                                       
                        this.$("#remove-template-tag-list").show();
                        searchterm = searchterm.toLowerCase();
                        this.$("#popular_template_tags li").filter(function() {                                                               
                             return $(this).find("a").text().toLowerCase().indexOf(searchterm) > -1;
                         }).show();
                    }
                    else{
                        this.$("#remove-template-tag-list").hide();
                        this.$("#popular_template_tags li").show();  
                    }
                },
                searchTemplateByTags:function(obj){
                    var li = $.getObj(obj,"li");                   
                    var tag_text = li.find("a").text();                    
                    this.loadTemplates('search','tag',{text:tag_text});
                },
                searchTemplate:function(obj){
                    var li = $.getObj(obj,"li");
                    // Remove the class from Total Temp
                    _.each(li.parents('div.ws-content.active').find('span.ttval').parents('ul').find('li.font-bold'),
                    function(k,v){
                        $(k).removeClass('font-bold');
                    });
                    if(!li.hasClass("active")){
                        this.$("#search-template-input").val('');
                        this.$('#clearsearch').hide();
                        this.$("#template_search_menu li,#template_layout_menu li").removeClass("active");
                        var html = li.clone();
                        $(this.el).find(".sortoption_expand").find('.spntext').html(html.text());
                        var searchType = li.find("a").attr("search");
                        if(searchType == "all"){
                            li.parents('div.ws-content.active').find('span.ttval').parent().addClass('font-bold');
                        }
                        this.$el.find("#template_search_menu").hide();
                        li.addClass("active");
                        this.loadTemplates('search',searchType);                       
                    }
                },
                loadTemplates:function(search,searchType,options){
                    var camp_obj = this;
                    var _data = {type:'search'}
                    if(!this.templates || search){
                        this.$(".thumbnails").children().remove();                        
                        this.app.showLoading('Loading Templates....',this.$(".template-container"));
                        if(camp_obj.$("#template_search_menu li.active").length){
                            var text = (this.$("#template_search_menu li.active").attr("text-info").toLowerCase().indexOf("templates")>-1)?"":this.$("#template_search_menu li.active").attr("text-info").toLowerCase();
                            this.$("#total_templates").html("<img src='img/recurring.gif'> "+text+" templates");                         
                        }
                        else{
                            this.$("#total_templates").html("<img src='img/recurring.gif'> templates");                         
                        }
                        
                        _data['searchType'] = "recent";
                        if(search && searchType){
                            _data['searchType'] = searchType;
                            if(options && options.layout_id){
                                _data['layoutId'] = options.layout_id;
                            }
                            else if(options && options.text){
                                _data['searchText'] = options.text;
                            }
                            else if(options && options.user_type){
                                _data['userType'] = options.user_type;
                            }
                            else if(options && options.category_id){
                                this.categoryName = this.app.encodeHTML(options.category_id);
                                _data['categoryId'] = this.categoryName;
                            }                            
                            if(searchType=="featured"){
                                _data['isFeatured'] = "Y"                                
                            }
                            if(searchType=="mobile"){
                                 _data['isMobile'] ="Y";                                
                            }
                            if(searchType=="returnpath"){
                                _data['isReturnPath'] ="Y";
                            }
                        }
                        this.offset = 0;
                        this.totalcount = 0;
                        this.searchString = _data;
                        this.callTemplates();
                    }
                    else{
                       // this.drawTemplates();
                    }
                },
                callTemplates:function(tcount,isTotal){
                    var remove_cache = false;
                    var newCount = 0;
                if(!tcount){
                    remove_cache = true;
                    this.offset = 0;
                    //this.$contactList.children(".contactbox").remove();
                    //this.app.showLoading("Loading Contacts...",this.$contactList);             
                    this.$(".notfound").remove();
                }
                else{
                    this.offset = this.offset + 20;
                }
                 if(this.template_request)
                              {
                                this.template_request.abort();
                              }
                    this.searchString['offset'] = this.offset;
                    this.searchString['bucket'] = 20;
                    
                    this.template_request = this.templateCollection.fetch({data: this.searchString,
                                success: _.bind(function(collection, response) {
                                                if(this.app.checkError(response)){
                                                    return false;
                                                }
                                                    
                                                    if(response.totalCount){
                                                        this.totalCount = response.totalCount;
                                                    }
                                                    this.showTotalCount(this.totalCount,isTotal);
                                                    this.app.showLoading(false,this.$(".template-container"));
                                                    if(this.$el.find('.thumbnails #new_template').length == 0){
                                                        this.$el.find('.thumbnails').append('<li class="span3" id="new_template" class="create_temp"><div style="height:475px;" class="thumbnail browse"><div style="" class="drag create"><span>Add Template </span></div></div></li>');
                                                    }
                                                _.each(collection.models, _.bind(function(model){
                                                        this.rowView = new templateRowView({model:model,sub:this,selectCallback:this.options.selectCallback,selectTextClass:this.selectTextClass});
                                                        this.$el.find('.thumbnails').append(this.rowView.$el);
                                                       this.rowView.tmPr.trimTags();
                                                    },this));
                                                    /*-----Remove loading------*/
                                                        this.app.removeSpinner(this.$el);
                                                    /*------------*/
                                                    this.$('#new_template').click(_.bind(this.createTemplate,this));
                                                   newCount = this.totalCount - this.offset;
                                                   //console.log('Total Count : '+ this.totalCount + ' Offset : ' + this.offset + ' New Count : ' + newCount + ' Collection Length '+ collection.length);
                                                   if(collection.length<parseInt(newCount)){
                                                     this.$(".thumbnails li:last-child").attr("data-load","true");
                                                    }
                                                    if(collection.length==0){
                                                        var search_message  ="";
                                                        if(this.searchString){
                                                          search_message +=" containing '"+this.searchString.searchText+"'" ;
                                                        }
                                                        //console.log(this.searchString);
                                                        //this.$(".template-container").append('<p class="notfound">No Templates found'+search_message+'</p>');
                                                        this.$("#total_templates").html('<p class="notfound nf_overwrite">No Templates found'+search_message+'</p>');
                                                    }
                                                    this.$(".footer-loading").hide();
                                                    
                                             }, this)
                            });
                },
             
                liveLoading:function(){
                    var $w = $(window);
                    var th = 200;
                    var inview = this.$(".thumbnails li:last-child").filter(function() {
                        var $e = $(this),
                            wt = $w.scrollTop(),
                            wb = wt + $w.height(),
                            et = $e.offset().top,
                            eb = et + $e.height();

                        return eb >= wt - th && et <= wb + th;
                      });
                    if(inview.length && inview.attr("data-load") && this.$el.height()){
                       inview.removeAttr("data-load");
                       this.$(".footer-loading").show();
                       this.callTemplates(20); 
                    }  
                },
                drawTemplates:function(){
                    var templates =  this.templates.templates;
                    var vars = [], hash;
                    var camp_obj = this;
                    var templates_html = "";
                    var hashes = this.searchString.split('&');                               
                    for(var i = 0; i < hashes.length; i++)
                    {
                        hash = hashes[i].split('=');
                        vars.push(hash[0]);
                        vars[hash[0]] = hash[1];
                    }
                     
                    if(templates){    
                        var self = this;
                        $.each(templates[0], function(index, val) { 
                            var adminTemplate = val[0].isAdmin==='Y'?"admin-template":"";
                            templates_html +='<li class="span3">';
                            templates_html +='<div class="thumbnail '+adminTemplate+'">';
                            if(val[0].isFeatured==='Y'){
                                templates_html +='<div class="feat_temp showtooltip" title="Click To View All Featured Templates"></div>';
                            }                                
                            if(val[0].isReturnPath==='Y'){
                                templates_html +='<div class="rpath showtooltip" title="Click To View All Return Path Tested Templates"></div>';
                            }       
                            templates_html +='<div class="img"><div><a class="selectbtn select-template main-action '+camp_obj.selectTextClass+'" id="temp_'+val[0]["templateNumber.encode"]+'"><span>'+camp_obj.selectText+'</span></a>';
                            
                            
                            var image_src = camp_obj.app.decodeHTML(val[0]["thumbURL"]);
                            if(image_src==""){
                                templates_html += '</div><img  src="img/templateimg.png" /></div>';
                            }
                            else{
                                templates_html += '</div><span><img src="'+camp_obj.app.decodeHTML(val[0]["thumbURL"])+'"></span></div>';
                            }
                            templates_html +='<div  class="caption">';
                            templates_html +='<h3 id="editfromname_'+val[0]["templateNumber.encode"]+'" class="template-name"><a>'+val[0].name+'</a></h3>';
                            if(val[0].categoryID){
                                templates_html +="<a class='cat showtooltip' cat_id='"+val[0].categoryID+"' title='Click to View All Templates In This Category'>"+val[0].categoryID+"</a>";//camp_obj.showCategoryTemplate(val[0].categoryID);
                            }
                            else{
                                templates_html +="<a class='cat' style='visibility:hidden'>&nbsp;</a>";
                            }
                            templates_html +='<p>'+camp_obj.showTagsTemplate(val[0].tags)+'</p>';
                            templates_html +='<div class="btm-bar">';
                            templates_html +='<span><em>'+val[0].viewCount+'</em> <span class="icon view showtooltip" title="Click to View Most Viewed Templates"></span></span>';
                            templates_html +='<span><em>'+val[0].usageCount+'</em> <span class="icon mail showtooltip"  title="Used Count"></span></span>';
                            //templates_html +='<a class="icon temp'+val[0].layoutID+' layout-footer right showtooltip" l_id="'+val[0].layoutID+'" title="Layout '+val[0].layoutID+'"></a>';
                            if(val[0].isAdmin==='Y'){
                                templates_html +='<a class="icon builtin right showtooltip" title="Click to View All Makesbridge Templates"></a>';                                                                                                        
                            }   
                            if(val[0].isMobile==='Y'){
                                templates_html +='<a class="icon mobile right showtooltip" title="Click to View All Mobile Enabled Templates"></a>';                                                                    
                            }
                            templates_html +='</div></div> </div></li>';                      
                        });
                    }
                    
                    if(templates_html==="" && this.offset==0){                        
                        this.$(".no-templates").show();
                    }
                    else{
                        this.$(".no-templates").hide();     
                        var template_html = $(templates_html);
                        this.$(".thumbnails").append(template_html);                        
                       template_html.find(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false}); 
                       
                       
                        template_html.find(".layout-footer").click(_.bind(function(obj){
                            var target = $.getObj(obj,"a");                            
                            this.$("#template_layout_menu li").eq(parseInt(target.attr("l_id"))).click();
                        },this));
                        template_html.find(".template-type").click(_.bind(function(obj){
                            var target = $.getObj(obj,"div");                           
                        },this));                        
                        template_html.find(".feat_temp").click(_.bind(function(obj){
                             this.$("#template_search_menu li:nth-child(3)").click();   
                        },this));
                        
                        
                        
                        
                        
                        if(camp_obj.options.selectCallback){                            
                            template_html.find(".select-template").click();
                        }
                        
                        template_html.find(".editbtn").click(_.bind(function(obj){
                            var target = $.getObj(obj,"a");
                            if(this.app.get("isAdmin") && this.app.get("isAdmin")=="N" && target.parents("div.thumbnail").hasClass("admin-template")){
                                this.app.showAlert("You don't have permissions to edit Makesbridge system template.",this.$el,{type:'caution'});
                                return false;
                            }
                            this.template_id = target.attr("id").split("_")[1];
                            this.updateTemplate();
                        },camp_obj));
                           template_html.find(".copybtn").click(_.bind(function(obj){
                            var target = $.getObj(obj,"a");
                            this.template_id = target.attr("id").split("_")[1];
                            this.copyTemplate();
                        },camp_obj));
                        
                        template_html.find("h3.template-name").click(_.bind(function(obj){ 
                            var target = $.getObj(obj,"h3");
                            if(this.app.get("isAdmin") && this.app.get("isAdmin")=="N" && target.parents("div.thumbnail").hasClass("admin-template")){
                                this.previewTemplate(obj,"h3");
                                return false;
                            }
                            this.template_id = $.getObj(obj,"h3").attr("id").split("_")[1];                            
                            this.updateTemplate();
                        },camp_obj));
                        
                        
                        template_html.find(".deletebtn").click(_.bind(function(obj){
                            var target = $.getObj(obj,"a");
                            if(this.app.get("isAdmin") && this.app.get("isAdmin")=="N" && target.parents("div.thumbnail").hasClass("admin-template")){
                                this.app.showAlert("You don't have permissions to delete Makesbridge system template.",this.$el,{type:'caution'});
                                return false;
                            }
                            this.template_id = target.attr("id").split("_")[1];
                            this.deleteTemplate(this.template_id);
                        },camp_obj));
                        
                        template_html.find(".previewbtn").click(_.bind(this.previewTemplate,this));
                    }
                    if((this.offset + parseInt(this.templates.count))<parseInt(this.totalcount)){
                        this.$(".thumbnails li:last-child").attr("data-load","true");
                    }
                    
                        
                    
                    
                   
                    
                },
                
                showCategoryTemplate:function(categories){
                     var _array = categories.split(",");
                     var _html ="";
                    $.each(_array,function(key,val){
                        _html +="<a class='cat' cat_id='"+val+"' >"+val+"</a>";                        
                    });
                    return _html
                },
                createTemplate:function(){
                    this.app.showAddDialog(
                    {
                      app: this.app,
                      heading : 'New Template',
                      buttnText: 'Create',
                      plHolderText : 'Enter template name here',
                      emptyError : 'Template name can\'t be empty',
                      createURL : '/pms/io/campaign/saveUserTemplate/',
                      fieldKey : "templateName",
                      postData : {type:'create',BMS_REQ_TK:this.app.get('bms_token')},
                      saveCallBack :  _.bind(this.app.mainContainer.createTemplateCall,this) // Calling same view for refresh headBadge
                    });
                    /*var dialog_width = 650;
                    var dialog_height = 100;
                    var dialog = this.app.showDialog({title:'New Template',
                        css:{"width":dialog_width+"px","margin-left":"-"+(dialog_width/2)+"px","top":"10%"},                     
                        bodyCss:{"min-height":dialog_height+"px"},
                        headerIcon : 'template',
                        buttons: {saveBtn:{text:'Create Template'} }                                                                           
                    });
                    var create_new_template = this.$("#create-template-container").clone();
                    create_new_template.css("display","block");
                    dialog.getBody().html(create_new_template);
                    create_new_template.find("input").focus();
                    dialog.saveCallBack(_.bind(this.createTemplateCall,this,dialog));
                    create_new_template.find("input").keydown(_.bind(function(e){
                        if(e.keyCode==13){
                            this.createTemplateCall(dialog);
                        }
                    },this));*/
                },     
                 keyvalid:function(event){
                        var regex = new RegExp("^[A-Z,a-z,0-9]+$");
                        var str = String.fromCharCode(!event.charCode ? event.which : event.charCode);
                         if (event.keyCode == 8 || event.keyCode == 32 || event.keyCode == 37 || event.keyCode == 39) {
                            return true;
                        }
                        else if (regex.test(str)) {
                            return true;
                        }
                       else{
                            return false;
                        }
                        event.preventDefault();
                   },
                   showTotalCount:function(count,isTotal){                    
                        // var _text = parseInt(count)<="1"?"Template":"Templates";
                        // var text_count = '<strong class="badge">'+this.app.addCommas(count)+'</strong>';
                         if(this.page.total_count==0){
                                this.page.total_count=count;
                                this.trigger('updatecount');
                            }else{
                                //this.$el.parents('.ws-content.active').find('.temp-count').text(count);
                            }
                    if(this.$("#template_search_menu li.active").length){
                        var text = (this.$("#template_search_menu li.active").attr("text-info").toLowerCase().indexOf("templates")>-1)?"":(this.$("#template_search_menu li.active").attr("text-info").toLowerCase()+" ");  
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong> <b>"+text+"</b> templates found");  
                    }
                    else if(this.searchString.searchText && this.searchString.searchType ==="nameTag"){
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong> templates found <b>for '"+$.trim(this.$("#search-template-input").val())+"'</b>");                         
                    }    
                    else if(this.searchString.searchType==='tag'){                        
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong> templates found <b>for tag '"+this.searchString.searchText+"'</b>");                         
                    }
                    else if(this.searchString.searchType === 'category'){
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong> templates found <b>for category '"+ this.categoryName+"'</b>");                         
                        
                    }else if(this.searchString.searchType === 'mobile'){
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong><b>Mobile</b> enabled templates found");                             
                    }
                    else if(this.searchString.searchType === 'admin'){
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong><b>Makesbridge</b> templates found"); 
                    }
                    else if(this.searchString.searchType.searchType === "returnpath"){
                        this.$("#total_templates").html("<strong class='badge'>"+count+"</strong><b>Return Path</b> enabled templates found"); 
                    }
                    else{
                        this.$("#total_templates").html("<strong class='badge'>"+count +"</strong> templates");
                        this.$el.parents('.ws-content.active').find('.temp-count').text(count);
                    }
                   // Creating Copy/deleting template update the total count 
                   if(isTotal){
                       this.$el.parents('.ws-content.active').find('.temp-count').text(count);
                   }
                },
                triggerAll: function(){
                        var target=this.$el.parents('.ws-content.active').find('.camp_header div .c-current-status li');
                        if(!target.hasClass('clickable_badge')){return false;}
                    this.$("#template_search_menu li:nth-child(2)").click(); 
                },
                toggleSortOption: function(ev) {
                    $(this.el).find("#template_search_menu").slideToggle();
                    ev.stopPropagation();
                }
        });
});
