define(['text!nurturetrack/html/nurturetracks.html','nurturetrack/collections/tracks','nurturetrack/track_row','nurturetrack/track_row_makesbridge','jquery.bmsgrid','jquery.searchcontrol'],
function (template,tracksCollection,trackRow,trackRowMakesbrdige) {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        // Nutrue Track listing view, depends on search control, chosen control, icheck control
        //
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        'use strict';
        return Backbone.View.extend({
            id: 'nuturetrack_list',
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
               //
               this.tracksRequest = new tracksCollection();                              
               this.offset = 0;               
               this.searchTxt = '';
               this.tagTxt = '';
               this.tracks_request = null;
               this.tracks_bms_request = null;
               this.app = this.options.app;  
               this.makesbridge_tracks = false;
               this.render();
            },
            /**
             * Initialize view .
            */
            render: function () {
               this.$el.html(this.template({}));                                       
               this.$tracksArea = this.$(".template-container");                                              
               this.initControls();               
               this.fetchTracks();               
            }
            /**
             * Custom init function called after view is completely render in wrokspace.
            */
            ,
            init:function(){
               this.current_ws = this.$el.parents(".ws-content");
               this.current_ws.find("#campaign_tags").hide();
               this.ws_header = this.current_ws.find(".camp_header .edited"); 
               this.addNewButton = this.current_ws.find(".show-add");
               this.addNewButton.attr("title","Add Nuture Track").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
               this.addCountHeader();               
               this.addNewButton.click(_.bind(this.addNurtureTrack,this))
            },
            addCountHeader:function(){
                this.ws_header.find(".c-current-status,.savedmsg").remove();
                this.tracksRequest.fetch({data:{type:'counts'},
                    success: _.bind(function (collection, response) {  
                        var header_part = $('<ul class="c-current-status">\n\
                        <li class="bmstrackcount"><a><span class="badge pclr23">'+response.systemCount+'</span>Makesbridge Nurture Tracks</a></li>\n\
                        <li class="usertrackcount" style="display:none"><a ><span class="badge pclr20">'+response.userCount+'</span>My Nurture Tracks</a></li>\n\
                        </ul>\n\
                        <div class="savedmsg" style="margin:2px 0 0;"> <span class="playingicon"></span> '+response.playCount+' Playing </div>');
                        var $header_part = $(header_part);                        
                        $header_part.find(".bmstrackcount").click(_.bind(this.showBmsTracks,this));
                        $header_part.find(".usertrackcount").click(_.bind(this.showUserTracks,this));
                        this.ws_header.append($header_part);
                }, this),
                  error: function (collection, resp) {

                  }
              });
                                            
            },
            /**
             * Initializing all controls here which need to show in view.
            */
            initControls:function(){
               //Init Controls on page 
               this.$(".nuture-search").searchcontrol({
                     id:'nuture-search',
                     width:'320px',
                     height:'22px',
                     gridcontainer: this.$('#nurturetrack_grid'),
                     placeholder: 'Search nurture tracks',                     
                     showicon: 'yes',
                     iconsource: 'campaigns'
              });
              this.$("#nurturetrack_grid").bmsgrid({
                    useRp : false,
                    resizable:false,
                    colresize:false,
                    height:'100%',
                    usepager : false,
                    colWidth : ['100%','90px','132px']
                });
                this.$tracksContainer = this.$("#nurturetrack_grid tbody");             
                
                this.$(".bms-nurture-search").searchcontrol({
                     id:'bms-nurture-search',
                     width:'320px',
                     height:'22px',
                     gridcontainer: this.$('#bms_nurturetrack_grid'),
                     placeholder: 'Search makesbridge nurture tracks',                     
                     showicon: 'yes',
                     iconsource: 'campaigns'
              });
              this.$("#bms_nurturetrack_grid").bmsgrid({
                    useRp : false,
                    resizable:false,
                    colresize:false,
                    height:'100%',
                    usepager : false,
                    colWidth : ['100%','90px','132px']
                });
                this.$tracksBmsContainer = this.$("#bms_nurturetrack_grid tbody");             
            },
            /**
             * Fetching contacts list from server.
            */
            fetchTracks:function(fcount){
                // Fetch invite requests from server
                var remove_cache = false;
                if(!fcount){
                    remove_cache = true;
                    this.offset = 0;
                    this.$tracksContainer.children().remove();
                    this.app.showLoading("Loading Nurture Tracks...",this.$tracksArea);             
                    this.$(".user_tracks .notfound").remove();
                }
                else{
                    this.offset = this.offset + 20;
                }
                var _data = {offset:this.offset,type:'list'};
                
                if(this.tracks_request){
                    this.tracks_request.abort();
                }                
                this.$("#total_templates").hide();
                this.tracks_request = this.tracksRequest.fetch({data:_data,remove: remove_cache,
                    success: _.bind(function (collection, response) {                                
                        // Display items
                        if(this.app.checkError(response)){
                            return false;
                        }
                        this.app.showLoading(false,this.$tracksArea);                                                                         
                        this.showTotalCount(response.count);
                        
                        //this.$contactLoading.hide();
                        
                        for(var s=this.offset;s<collection.length;s++){
                            var trackView = new trackRow({ model: collection.at(s),sub:this });                                                            
                            this.$tracksContainer.append(trackView.$el);
                        }                        
                        
                        if(collection.length<parseInt(response.totalCount)){
                            this.$tracksContainer.last().attr("data-load","true");
                        } 
                        if(collection.length==0){
                            var search_message  ="";
                            if(this.searchTxt){
                              search_message +=" containing '"+this.searchTxt+"'" ;
                            }
                            if(this.$(".user_tracks .notfound").length==0){
                                this.$(".user_tracks .bDiv").append('<p class="notfound">No nurture tracks found'+search_message+'</p>');
                            }
                            else{
                                this.$(".user_tracks .notfound").show();
                            }                            
                        }    
                        else{
                            this.$(".user_tracks .notfound").hide();
                        }
                        
                    }, this),
                    error: function (collection, resp) {
                            
                    }
                });
            },
            /**
             * Fetching contacts list from server.
            */
            fetchBmsTracks:function(fcount){
                // Fetch invite requests from server
                var remove_cache = false;
                if(!fcount){
                    remove_cache = true;
                    this.offset = 0;
                    this.$tracksBmsContainer.children().remove();
                    this.app.showLoading("Loading makesbridge nurture tracks...",this.$tracksArea);             
                    this.$(".bms_tracks .notfound").remove();
                }
                else{
                    this.offset = this.offset + 20;
                }
                var _data = {offset:this.offset,type:'list',isAdmin:'Y'};
                
                if(this.tracks_bms_request){
                    this.tracks_bms_request.abort();
                }                
                this.$("#total_bms_tracks").hide();
                this.makesbridge_tracks = true;
                this.tracks_bms_request = this.tracksRequest.fetch({data:_data,remove: remove_cache,
                    success: _.bind(function (collection, response) {                                
                        // Display items
                        if(this.app.checkError(response)){
                            return false;
                        }
                        this.app.showLoading(false,this.$tracksArea);                                                                         
                        this.showBmsTotalCount(response.count);
                        
                        //this.$contactLoading.hide();
                        
                        for(var s=this.offset;s<collection.length;s++){
                            var trackView = new trackRowMakesbrdige({ model: collection.at(s),sub:this });                                                            
                            this.$tracksBmsContainer.append(trackView.$el);
                        }                        
                        
                        if(collection.length<parseInt(response.totalCount)){
                            this.$tracksBmsContainer.last().attr("data-load","true");
                        } 
                        if(collection.length==0){
                            var search_message  ="";
                            if(this.searchTxt){
                              search_message +=" containing '"+this.searchTxt+"'" ;
                            }
                            if(this.$(".bms_tracks .notfound").length==0){
                                this.$(".bms_tracks .bDiv").append('<p class="notfound">No makesbridge nurture tracks found'+search_message+'</p>');
                            }
                            else{
                                this.$(".bms_tracks .notfound").show();
                            }                            
                        }    
                        else{
                            this.$(".bms_tracks .notfound").hide();
                        }
                        
                    }, this),
                    error: function (collection, resp) {
                            
                    }
                });
            },
             /**
            * Fetch next records on scroll and resize.
            *
            * @returns .
            */
            liveLoading:function(){
                var $w = $(window);
                var th = 200;
                var inview = this.$(".contactbox").last().filter(function() {
                    var $e = $(this),
                        wt = $w.scrollTop(),
                        wb = wt + $w.height(),
                        et = $e.offset().top,
                        eb = et + $e.height();
                    return eb >= wt - th && et <= wb + th;
                  });
                if(inview.length && inview.attr("data-load") && this.$el.height()>0){
                   inview.removeAttr("data-load");
                   this.$contactLoading.show();                         
                   this.fetchContacts(20);
                }  
            },
             /**
            * Search contacts function binded with search control
            *
            * @param {o} textfield simple object.             
            * 
            * @param {txt} search text, passed from search control.
            * 
            * @returns .
            */
            searchContacts:function(o,txt){
                this.tagTxt = '';
                this.searchTxt = txt;                                
                if(o.keyCode==13 && this.searchTxt){
                    if(this.searchTxt.indexOf("Tag: ")>-1){
                       var tagName = this.searchTxt.split(": ");
                       this.searchByTag(tagName[1]);
                    }
                    else{
                        this.fetchContacts();
                    }
                   
                }                
            },
             /**
            * Clear Search Results
            * 
            * @returns .
            */
            clearSearchContacts:function(){
                this.tagTxt = '';
                this.searchTxt = '';                
                this.fetchContacts();                
            },
            /**
            * Sort contacts by selected sort type from selectbox
            * 
            * @returns .
            */
            sortContacts:function(){                                
                this.sortBy = this.$(".recent-activities").val();
                this.fetchContacts();
            }
            ,
            showTotalCount:function(count){                
                this.$("#total_templates").show();
                this.$(".total-count").html(this.app.addCommas(count));                                       
                var _text = count=="1"?"My Nurture Tracks":"My Nurture Tracks";                
                this.$(".total-text").html(_text)
                                     
            },
            showBmsTotalCount:function(count){                
                this.$("#total_bms_tracks").show();
                this.$(".total-bms-count").html(this.app.addCommas(count));                                       
                var _text = count=="1"?"Makesbridge Nurture Tracks":"Makesbridge Nurture Tracks";                
                this.$(".total-bms-text").html(_text)
                                     
            },
            searchByTag:function(tag){
               this.searchTxt = '';
               this.$("#contact-search").val("Tag: "+tag);
               this.$("#clearsearch").show();
               this.tagTxt = tag;
               this.fetchContacts();
            },
            updateRefreshCount:function(){                
               var checked_count = this.$(".contact-row-check:checked").length;                
               if(checked_count>0){
                   this.$("#total_templates").hide();
                   this.$("#total_selected").show();
                   this.$(".total-selected-count").html(checked_count);
                   var _text = checked_count>1 ?"contacts":"contact";
                   this.$(".total-selected-text").html(_text+" selected");
               }
               else{
                   this.$("#total_templates").show();
                   this.$("#total_selected").hide();
               }
            },
            addNurtureTrack:function(){                                            
                var dialog = this.app.showDialog({title:'New Nurture Track',
                    css:{"width":"650px","margin-left":"-325px"},
                    bodyCss:{"min-height":"100px"},							   
                    headerIcon : 'new_headicon',
                    buttons: {saveBtn:{text:'Create Nurture Track'} }                                                                           
                });
                this.app.showLoading("Loading...",dialog.getBody());
                require(["nurturetrack/newnurturetrack"],_.bind(function(trackPage){                                     
                    var mPage = new trackPage({page:this,newdialog:dialog});
                    dialog.getBody().html(mPage.$el);
                    mPage.$("input").focus();
                    dialog.saveCallBack(_.bind(mPage.createNurtureTrack,mPage));
                },this));
            },
            showBmsTracks:function(){
                this.$(".user_tracks").hide();
                this.$(".bms_tracks").fadeIn();
                this.ws_header.find(".bmstrackcount").hide();
                this.ws_header.find(".usertrackcount").show();
                if(this.makesbridge_tracks ===false){
                    this.fetchBmsTracks();
                }
            },
            showUserTracks:function(){
                this.$(".bms_tracks").hide();
                this.$(".user_tracks").fadeIn();                                
                this.ws_header.find(".bmstrackcount").show();
                this.ws_header.find(".usertrackcount").hide();
            }
        });
});