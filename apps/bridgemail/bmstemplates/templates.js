define(['text!bmstemplates/html/templates.html','jquery.highlight'],
function (template,highlight) {
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
                
            },
            /**
             * Initialize view - backbone .
            */
            initialize:function(){              
               this.template = _.template(template);		
               this.offset = 0;
               this.totalcount = 0;
               this.searchValue = "";
               this.searchString = "";
               this.templates = null;               
               this.getTemplateCall = null;
               //              
               this.render();
            },
            /**
             * Initialize view .
            */
            render: function () {
               this.$el.html(this.template({}));
               this.app = this.options.app;           
               this.page = this.options.page;
               this.selectText  = this.options.selectAction?this.options.selectAction:'Select Template';
               
              
            }
            /**
             * Custom init function called after view is completely render in wrokspace.
            */
            ,
            init:function(){                
               this.attachEvents();
               this.loadTemplates();
               this.$(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
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
                    })

                    $(window).scroll(_.bind(this.liveLoading,this));
                    $(window).resize(_.bind(this.liveLoading,this));
                    
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
                       this.callTemplates(this.searchString); 
                    }  
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
                    
                    if(obj.keyCode==13){                       
                        this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                                          
                        this.getTemplateCall.abort();
                        if(val!==""){
                            this.loadTemplates('search','nameTag',{text:val});
                        }
                        else{
                            this.$("#template_search_menu li:first-child").click();
                        }                        
                    }
                    if(val==""){
                        if(this.searchValue!=val){
                            this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                                          
                            this.getTemplateCall.abort();
                            if(val!==""){
                                this.loadTemplates('search','nameTag',{text:val});
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
                    if(!li.hasClass("active")){
                        this.$("#search-template-input").val('');
                        this.$("#template_search_menu li,#template_layout_menu li").removeClass("active");
                        var searchType = li.find("a").attr("search");                        
                        li.addClass("active");
                        this.loadTemplates('search',searchType);                       
                    }
                },
                loadTemplates:function(search,searchType,options){
                    var camp_obj = this;
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
                        
                        var searchString = "&type=search&searchType=recent";
                        if(search && searchType){
                            searchString = "&type=search&searchType="+searchType;
                            if(options && options.layout_id){
                                searchString +="&layoutId="+options.layout_id;
                            }
                            else if(options && options.text){
                                searchString +="&searchText="+options.text;
                            }
                            else if(options && options.user_type){
                                searchString +="&userType="+options.user_type;
                            }
                            else if(options && options.category_id){
                                searchString +="&categoryId="+options.category_id;
                            }
                            
                            if(searchType=="featured"){
                                searchString +="&isFeatured=Y"                                
                            }
                        }
                        this.offset = 0;
                        this.totalcount = 0;
                        this.searchString = searchString;
                        this.callTemplates(searchString,options);
                    }
                    else{
                        this.drawTemplates();
                    }
                },
                callTemplates:function(searchString,options){
                    var camp_obj = this;
                    var offset = this.offset==0?0:this.offset;
                    var URL = "/pms/io/campaign/getUserTemplate/?BMS_REQ_TK="+this.app.get('bms_token')+searchString+"&offset="+offset+"&bucket=12"; //&offset=0&bucket=20                                            
                    this.getTemplateCall = jQuery.getJSON(URL,  function(tsv, state, xhr){
                       if(xhr && xhr.responseText){                        
                           camp_obj.app.showLoading(false,camp_obj.$(".template-container"));
                            var templates_json = jQuery.parseJSON(xhr.responseText);                                                                                               
                            if(camp_obj.app.checkError(templates_json)){
                                return false;
                             }                            
                            camp_obj.templates = templates_json;
                            if(options && options.callback){
                                options.callback(templates_json);
                            }
                            //camp_obj.$("#search-template-input").prop("disabled",false).val("");
                            if(camp_obj.totalcount==0){
                               camp_obj.totalcount =  templates_json.totalCount;
                            }
                            camp_obj.drawTemplates();
                            camp_obj.offset = camp_obj.offset + parseInt(templates_json.count); 
                       }
                     }).fail(function() { console.log( "error in loading templates" ); });
                }
                ,
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
                     if(this.$("#template_search_menu li.active").length){
                        var text = (this.$("#template_search_menu li.active").attr("text-info").toLowerCase().indexOf("templates")>-1)?"":(this.$("#template_search_menu li.active").attr("text-info").toLowerCase()+" ");  
                        this.$("#total_templates").html("<strong class='badge'>"+this.totalcount+"</strong> <b>"+text+"</b> templates found");                         
                    }
                    else if(this.searchString.indexOf("=nameTag")>-1){
                        this.$("#total_templates").html("<strong class='badge'>"+this.totalcount+"</strong> templates found <b>for '"+$.trim(this.$("#search-template-input").val())+"'</b>");                         
                    }    
                    else if(this.searchString.indexOf("=tag")>-1){                        
                        
                        this.$("#total_templates").html("<strong class='badge'>"+this.totalcount+"</strong> templates found <b>for tag '"+vars["searchText"]+"'</b>");                         
                    }
                    else{
                        this.$("#total_templates").html("<strong class='badge'>"+this.totalcount +"</strong> templates");
                    }
                   
                    if(templates){                        
                        $.each(templates[0], function(index, val) { 
                            templates_html +='<li class="span3">';
                            templates_html +='<div class="thumbnail">';
                            if(val[0].isFeatured==='Y'){
                                templates_html +='<div class="feat_temp showtooltip" title="Featured Template"></div>';
                            }                                

                            templates_html +='<div class="img"><div><a class="previewbtn" id="preview_'+val[0]["templateNumber.encode"]+'" ><span ></span>Preview Template</a> <a class="selectbtn select-template" id="temp_'+val[0]["templateNumber.encode"]+'"><span ></span>'+camp_obj.selectText+'</a></div> <img alt="" data-src="holder.js"  src="img/templateimg.png"></div>';
                            templates_html +='<div class="caption">';
                            templates_html +='<h3><a>'+val[0].name+'</a></h3>';
                            templates_html +="<a class='cat' cat_id='"+val[0].categoryID+"'>"+val[0].categoryID+"</a>";//camp_obj.showCategoryTemplate(val[0].categoryID);
                            templates_html +='<p>'+camp_obj.showTagsTemplate(val[0].tags)+'</p>';
                            templates_html +='<div class="btm-bar">';
                            templates_html +='<span><em>'+val[0].usageCount+'</em> <span class="icon view showtooltip" title="View Count"></span></span>';
                            templates_html +='<span><em>'+val[0].viewCount+'</em> <span class="icon mail showtooltip"  title="Used Count"></span></span>';
                            //templates_html +='<a class="icon temp'+val[0].layoutID+' layout-footer right showtooltip" l_id="'+val[0].layoutID+'" title="Layout '+val[0].layoutID+'"></a>';
                            if(val[0].isAdmin==='Y'){
                                templates_html +='<a class="icon builtin right showtooltip" title="Builtin"></a>';                                                                                                        
                            }       
                            templates_html +='<a class="icon mobile right showtooltip" title="For Mobile"></a>';                                                                    
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
                       template_html.find(".view").click(_.bind(function(){
                            this.$("#template_search_menu li:nth-child(4)").click();
                        },this));
                        template_html.find(".mail").click(_.bind(function(){
                            this.$("#template_search_menu li:first-child").click();
                        },this));
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
                        
                        template_html.find(".caption p a").click(_.bind(function(obj){
                             var tag = $.getObj(obj,"a");
                             this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                  
                             this.loadTemplates('search','tag',{text:tag.text()});  
                        },this));
                        
                        template_html.find(".mobile").click(_.bind(function(obj){                             
                             this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                  
                             this.loadTemplates('search','mobile');  
                        },this));
                        
                        template_html.find(".cat").click(_.bind(function(obj){     
                             var cat = $.getObj(obj,"a");
                             this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                  
                             this.loadTemplates('search','category',{category_id:cat.attr("cat_id")});  
                        },this));
                        
                        template_html.find(".builtin").click(_.bind(function(obj){                             
                             this.$("#template_layout_menu li,#template_search_menu li").removeClass("active");                                                  
                             this.loadTemplates('search','admin',{user_type:'A'});  
                        },this));
                        
                        if(camp_obj.options.selectCallback){
                            template_html.find(".select-template").click(camp_obj.options.selectCallback);
                        }
                        
                        template_html.find(".previewbtn").click(_.bind(function(obj){                              
                              var target = $.getObj(obj,"a");
                              var bms_token =this.app.get('bms_token');
                              
                              var dialog_width = $(document.documentElement).width()-60;
                              var dialog_height = $(document.documentElement).height()-182;
                              var dialog = camp_obj.app.showDialog({title:'Template Preview',
                                          css:{"width":dialog_width+"px","margin-left":"-"+(dialog_width/2)+"px","top":"10px"},
                                          headerEditable:false,
                                          bodyCss:{"min-height":dialog_height+"px"}                                                                          
                               });
                              this.app.showLoading('Loading Preview...',dialog.getBody());                              
                              var URL = "/pms/io/campaign/getUserTemplate/?BMS_REQ_TK="+bms_token+"&type=html&templateNumber="+target.attr("id").split("_")[1];                              
                              jQuery.getJSON(URL,function(tsv, state, xhr){
                                  var html_json = jQuery.parseJSON(xhr.responseText);
                                  var preview_iframe = $("<iframe class=\"email-iframe\" style=\"height:"+dialog_height+"px\" frameborder=\"0\" src=\"about:blank\"></iframe>");                            
                                  dialog.getBody().html(preview_iframe);
                                  preview_iframe[0].contentWindow.document.open('text/html', 'replace');
                                  preview_iframe[0].contentWindow.document.write(camp_obj.app.decodeHTML(html_json.htmlText,true));
                                  preview_iframe[0].contentWindow.document.close();
                                  
                              });
                              
                        },this));
                    }
                    if((this.offset + parseInt(this.templates.count))<parseInt(this.totalcount)){
                        this.$(".thumbnails li:last-child").attr("data-load","true");
                    }
                    
                    if(this.searchString.indexOf("=nameTag")>-1){
                        this.$(".thumbnails .caption").highlight($.trim(this.$("#search-template-input").val()));
                    }    
                    else if(this.searchString.indexOf("=tag")>-1){
                        this.$(".thumbnails .caption p").highlight(vars["searchText"]);
                    }
                    else if(this.searchString.indexOf("=category")>-1){
                        this.$(".thumbnails .caption .cat").highlight(vars["categoryId"]);
                    }
                    this.$(".footer-loading").hide();
                    
                },
                showTagsTemplate:function(tags){
                   var tag_array = tags.split(",");
                   var tag_html ="";
                    $.each(tag_array,function(key,val){
                        tag_html +="<a>"+val+"</a>";
                        if(key<tag_array.length-1){
                            tag_html +=", ";
                        }
                    });
                    return tag_html; 
                },
                showCategoryTemplate:function(categories){
                     var _array = categories.split(",");
                     var _html ="";
                    $.each(_array,function(key,val){
                        _html +="<a class='cat' cat_id='"+val+"'>"+val+"</a>";                        
                    });
                    return _html
                }
        });
});