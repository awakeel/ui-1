define(['text!common/html/templatePreview.html','common/ccontacts',,'jquery.icheck'],
function (template,contactsView,icheck) {
     /////////////////////////////////////////////////////////////////////////////////////////////////////////
     //
     // Template Preview
     //
     /////////////////////////////////////////////////////////////////////////////////////////////////////////
      'use strict';
     return Backbone.View.extend({            
            /**
             * Attach events on elements in view.
            */     
            events: {				
                'click .sendcamp':'emailbtnToggle',  // Click event of Send email
                'click #send-template-preview':'sendTempPreview',
                'click #camp-prev-select-contact':'loadContact',
                'keyup #prev-email':'sendTempKey',
                'click .show-original-btn':'showOrginalClick',
                'click .annonymous-btn':'anonymousbtnClick',
                'click .prev-iframe-campaign':'htmlTextClick',
                'click .contact-remove-prev':'removeContact'
            }, 
            /**
             * Initialize view - backbone .
            */
            initialize:function(){              
               this.template = _.template(template);
               this.url = '';
               this.bms_token=null;
               this.tempNum = null;
               this.original = 'N';
               this.html = 'Y';
               this.subNum  = null;
               this.render();
            },
             /**
             * Initialize view .
            */
            render: function () {
               
               this.$el.html(this.template());
               this.app = this.options.app;           
               //this.page = this.options.page;
               //this.selectText  = this.options.selectAction?this.options.selectAction:'Select Template';
               //this.selectTextClass = this.options.selectTextClass?this.options.selectTextClass:'';
               /*if(this.options.hideCreateButton){
                   this.$(".iconpointy").hide();
               }*/
              this.$(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
            },
             init:function(){                
              
               this.showFrame();
               this.initCheckbox();
                this.loadPrevTemplates();
                    /*Check and Uncheck of Checkbox*/
                    this.$('.show-original').on('ifChecked',_.bind(function(event) {
                        this.setiFrameSrc();
                    },this));
                    this.$('.show-original').on('ifUnchecked',_.bind(function(event){
                        this.setiFrameSrc();
                    },this));
               //this.loadTemplates();
               //this.$(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false});
            },
            attachEvents:function(){
                /*Email Button toggle*/
                this.emailbtnToggle();
                
            },
            emailbtnToggle:function(){
                if(this.$('#prevtem-sendpreview').css('display')==='none'){
                    this.$('#prevtem-sendpreview').fadeIn('slow');
                    this.$('#prev-email').focus();
                    this.$('#prev-email').parent().removeClass('error');
                    this.$('#prev-email').parent().find('span').remove();
                }else{
                    this.$('#prevtem-sendpreview').fadeOut('slow');
                }
            },
            showFrame: function(){ // Show Iframe on default load
                if(this.options.prevFlag==='C'){
                  this. setiFrameSrc();
                }else{
               this.$('#email-template-iframe').attr('src',this.options.frameSrc).css('height',this.options.frameHeight-36);
                }
             },
            setiFrameSrc:function(){ // HTML & Text Tab Click
                    /*Check show Orginal*/
                    if(this.$('.show-original').is(':checked')){    
                         this.original = 'Y';
                     }else{
                    this.original = 'N';
                    }
                    /*check contact selected or not*/
                    if(this.$('.selected').attr('id')==="prev-iframe-html"){
                        this.html='Y';
                    }
                   else{
                       this.html='N';
                   }
                  var frame = this.options.frameSrc+"&html="+this.html+"&original="+this.original;
                  /*Check if Contact is selected or not*/
                   if(this.subNum !== null){
                      frame+="&subNum="+this.subNum; 
                   }
                  this.$('#email-template-iframe').attr('src',frame).css('height',this.options.frameHeight-161);
            },
            loadPrevTemplates: function(){
                if(this.options.prevFlag==='T'){
                    this.$('.previewbtns').hide();
                }else if(this.options.prevFlag==='C'){
                    this.$('.previewbtns').show();
                }
            },
            sendTempPreview: function(){ // Template Preview Send
                var email = this.$('#prev-email').val();
                var validEmail = this.options.app.validateEmail(email);
                if(validEmail){
                    this.$('#prev-email').parent().removeClass('error');
                    this.$('#prev-email').parent().find('span').remove();
                    this.dynamicRequest();
                    var post_val = this.$('#sendtemp-preview').serialize();
                    this.$('#send-template-preview').addClass('loading-preview');
                    this.$('#prev-email').attr('disabled','disabled');
                    $.post(this.url, post_val)
                        .done(_.bind(function(data) { 
                                    data = JSON.parse(data);
                                    if(data[0]=="success"){
                                        this.$('#prev-email').val("");
                                        this.app.showMessge('Template Preview Sent Successfully');
                                        this.$('#send-template-preview').removeClass('loading-preview');
                                        this.$('#prev-email').removeAttr('disabled');
                                        this.$('.contact-name').text('');
                                        this.$('#prevtem-sendpreview').hide();
                                        this.$('#contact-name-prev').hide();
                                        this.subNum = null;
                                    }
                                },this));
                }else{
                    this.$('#prev-email').parent().addClass('error');
                    this.$('#prev-email').parent().append('<span class="errortext"><i class="erroricon"></i><em>'+this.options.app.messages[0].CAMP_fromemail_format_error+'</em></span>');
                }
                
            },
            loadContact:function(ev){
                var btnID = ev.currentTarget.id;
                if(!$('#'+btnID).hasClass('active')){
                     this.$('#'+btnID).addClass('active');
                     this.$('.annonymous-btn').removeClass('active');
                    var active_ws = $(".modal-body");
                    active_ws.find('.campaign-clickers').fadeOut('fast');
                }else{
                    $('#'+btnID).removeClass('active');
                   this.$('.annonymous-btn').addClass('active');
                if($("body").hasClass('modal-open')){
                     var offset = $(ev.target).offset();
                     var active_ws = $(".modal-body");
                     active_ws.find('.campaign-clickers').remove();
                     active_ws.append("<div class='dddiv-prevCam campaign-clickers' id='campaign-temp-contact-dialog'></div>"); 
                      active_ws.find('.campaign-clickers').append(new contactsView({page:this}).el)
                      /*active_ws.find(".campaign-clickers .closebtn").on('click', function(){
                      that.closeContactsListing();
                      });*/
                      //ev.stopPropagation();
                    }
                  return;
                }
                
            },
            htmlTextClick:function(ev){
                var tabID = ev.currentTarget.id;
                this.$('.prev-iframe-campaign').removeClass('selected');
                this.$('#'+tabID).addClass('selected');
                this.setiFrameSrc();
            },
            sendTempKey:function(ev){
                ev.preventDefault();
                if(ev.keyCode===13){
                    this.sendTempPreview();
                }
            },
             initCheckbox : function(){
                 this.$('.show-original').iCheck({
                         checkboxClass: 'checkpanelinput previewbtns',
                         insert: '<div class="icheck_line-icon" style="margin: 4px 0 0 7px;"></div>'
                     });
             },
             showOrginalClick:function(){
                 if(this.$('.show-original').is(':checked')){
                     this.$('.show-original').iCheck('uncheck');
                 }else{
                   this.$('.show-original').iCheck('check');
                 }
                 this.setiFrameSrc();
             },
             anonymousbtnClick:function(){
                 this.$('#camp-prev-select-contact').addClass('active');
                 var active_ws = $(".modal-body");
                 active_ws.find('.campaign-clickers').fadeOut('fast');
                 this.$('.annonymous-btn').removeClass('active');
                 this.$('#contact-name-prev').hide();
                 this.$('.contact-name').text('');
                 this.subNum = null; 
                 this.setiFrameSrc();
             },
             dynamicRequest:function(){
                    this.bms_token = this.app.get('bms_token');
                    this.tempNum = this.options.tempNum;
                    if (this.options.prevFlag === 'T') {
                        this.url = "/pms/io/campaign/saveUserTemplate/?BMS_REQ_TK=" + this.bms_token + "&type=email&templateNumber=" + this.tempNum;
                    }
                    else if (this.options.prevFlag === 'C') {
                        if (this.$('.show-original').is(':checked')) {
                            this.original = 'Y';
                        } else {
                            this.original = 'N';
                        }
                        var val = this.$('.selected').attr('id');
                        if(val==="prev-iframe-text"){
                            this.html = 'N';
                        }else{
                            this.html = 'Y';
                        }
                        this.url = "/pms/io/campaign/saveCampaignData/?BMS_REQ_TK=" + this.bms_token + "&type=email&campNum=" + this.tempNum + "&html=" + this.html + "&original=" + this.original;
                        if (this.subNum !== null) {
                            this.url += "&subNum=" + this.subNum;
                        }
                    }
                 },
                 removeContact:function(){
                this.$el.parents('.modal-body').find('.contact-name').text('');
                this.$('#camp-prev-select-contact').addClass('active');
                var active_ws = $(".modal-body");
                this.$('.annonymous-btn').removeClass('active');
                 active_ws.find('.campaign-clickers').fadeOut('fast');
                this.$('#contact-name-prev').hide();
                this.setiFrameSrc();
            }
       });
    
});

