define(['jquery', 'backbone', 'underscore', 'app', 'text!templates/common/header.html', 'notifications/notifications'],
        function($, Backbone, _, app, template, Notifications) {
            'use strict';
            return Backbone.View.extend({
                tagName: 'div',
                
                events: {
                    'click .overlay-notification':'hideMessageDialog',
                    'click .dropdown-menu li': function(obj) {
                        app.openModule(obj);
                    },
                    /*Menues*/
                    'click .campaigns-li': function(obj) {
                        //app.mainContainer.openCampaign();
                        app.mainContainer.addWorkSpace({type: '', title: 'Campaigns', sub_title: 'Listing', url: 'campaigns', workspace_id: 'campaigns', 'addAction': true, tab_icon: 'campaignlisting'});
                    }
                    ,
                    'click .contacts-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: 'Contacts', sub_title: 'Listing', url: 'contacts', workspace_id: 'contacts', 'addAction': true, tab_icon: 'contactlisting'});
                    },
                    'click .reports-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: 'Reports', sub_title: 'Analytic', url: 'reports/campaign_report', workspace_id: 'camp_reports', tab_icon: 'reports', single_row: true});
                    }
                    ,
                    'click .csv-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: 'CSV Upload', sub_title: 'Add Contacts', url: 'listupload/csvupload', workspace_id: 'csv_upload', tab_icon: 'csvupload', single_row: true});
                    },
                    'click .crm-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: 'Connections', sub_title: 'CRM', url: 'crm/crm', workspace_id: 'crm', tab_icon: 'crm', single_row: true});
                    }
                    ,
                    'click .studio_add-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: this.getTitle(obj)});
                    },
                    'click .analytics_reports-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: this.getTitle(obj)});
                    },
                    'click .add-template-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: 'Template Gallery', sub_title: 'Gallery', url: 'mytemplates', workspace_id: 'mytemplates', 'addAction': true, tab_icon: 'mytemplates'});
                    },
                    'click .image-gallery-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: 'Images', sub_title: 'Gallery', url: 'userimages/userimages', workspace_id: 'userimages', tab_icon: 'graphiclisting'});
                    },
                    'click .analytics_add-list-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: this.getTitle(obj)});
                    },
                    'click .analytics_forms-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: this.getTitle(obj)});
                    },
                    'click .analytics_segments-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: this.getTitle(obj)});
                    }

                    ,
                    'click .list-management-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: 'wizard',
                            title: "List Management",
                            url: 'list',
                            wizard: {steps: 4, active_step: 1, step_text: []}
                        });
                    },
                    'click .automation-li': function(obj) {

                    }
                    ,
                    'click .account-li': function(obj) {
                        app.mainContainer.addWorkSpace({type: '', title: "My Account"});
                    },
                    //'click .sc-links span.ddicon':'scDropdown',
                    //'click .new-campaign': 'createNewCampaign',
                    'click .csv-upload': 'csvUpload',
                    'click .new-nurturetrack': 'addNurtureTrack',
                    'click .messagesbtn': 'loadNotifications'
                },
                initialize: function() {
                    this.template = _.template(template);
                    this.render();
                    this.newMessages = null;
                  
                    
                },
                render: function() {
                    this.$el.html(this.template({}));
                    this.$(".showtooltip").tooltip({'placement': 'bottom', delay: {show: 0, hide: 0}, animation: false});
                     var that = this;
                     that.updateNotfication()
                      setInterval(function(){
                                that.updateNotfication();
                    },60000);
                    this.$('.sc-links .ddicon').mouseenter(_.bind(function(event) {
                        $('.dropdown-nav').hide();
                        $('.icon-menu').removeClass('active');
                        if (this.$('.sc-links ul').hasClass('open')) {
                            this.$('.sc-links ul').removeClass('open');
                            this.$('.sc-links ul').hide();
                        } else {
                            this.$('.ddlist').addClass('open').show();
                        }
                        event.stopPropagation();
                    }, this));
                    /*Show & Hide the Main menu via jquery*/
                    this.$('#add-menu').on('mouseover', _.bind(function(e) {
                        $('.icon-menu').removeClass('active');
                        $('#slidenav-newdd').hide();
                        this.$('#add-menu').css('display', 'block');
                        //this.$('.dropdown-nav-addcampaign i').addClass('activeB');
                    }, this));
                    this.$('#add-menu').on('mouseout', _.bind(function(e) {
                        var e = e.toElement || e.relatedTarget;
                        if (e) {
                            if (e.parentNode == this || e.parentNode.parentNode == this || e.parentNode.parentNode.parentNode == this || e == this) {
                                return;
                            }
                        }
                        this.$('#add-menu').css('display', 'none');
                    }, this));
                    // Hide all dropdown
                    this.$('.add-new-header').on('mouseover', _.bind(function() {
                        this.$('.sc-links ul').removeClass('open');
                        $('.icon-menu').removeClass('active');
                        $('#slidenav-newdd').hide();
                        this.$('#add-menu').css('display', 'none');
                    }, this))
                },
                getTitle: function(obj) {
                    var title = $(obj.target).parent("li").find("a").text();
                    return title;
                },
                csvUpload: function() {
                    this.addWorkSpace({type: '', title: 'CSV Upload', sub_title: 'Add Contacts', url: 'listupload/csvupload', workspace_id: 'csv_upload', tab_icon: 'csvupload', single_row: true});
                },
                loadNotifications: function() {
                    if (this.$el.find(".messages_dialogue").length > 0 && this.$el.find(".messages_dialogue").is(':visible')) {
                        this.$el.find(".messages_dialogue").slideUp('fast');
                        return;
                    }
                    var that = this;
                    this.$el.find(".messages_dialogue").slideDown('fast');
                    this.$el.find(".messages_dialogue").html(new Notifications({newMessages : this.newMessages,isModel:false}).el)
                    this.$el.find(".messages_dialogue").append("<div class='viewallmsgs' style='margin:0px;padding:0px;height:40px'><div style='text-align:center'><a class='btn-blue' style='margin-top:5px;'><span class='view-all'>View All Messages </span></a></div></div>");
                    this.$el.find(".messages_dialogue").find(".view-all").on("click",function(){
                         
                        that.$el.find(".messages_dialogue").addClass('popmodel').html(new Notifications({isModel:true,newMessages : that.newMessages}).el)
                         that.$el.find(".popmodel").css({
                        "position": "absolute",
                        "height":$(window).height() - 200+ "px",
                        "top": "70px",
                        "left": ((($(window).width() -  that.$el.find(".popmodel").outerWidth()) / 2) + $(window).scrollLeft() + "px")});
                        that.$el.find(".overlay").show();
                        that.$el.find(".messages_dialogue").find(".all-notification").css("height",$(window).height() - 230 + "px");
                    });
                      
                },
                hideMessageDialog:function(ev){
                   this.$el.find(".messages_dialogue").removeAttr('style');
                   this.$el.find(".messages_dialogue").removeClass('popmodel').hide();
                   $(ev.target).hide();
                },
               updateNotfication:function(){
                     var URL = "/pms/io/user/notification/?BMS_REQ_TK="+app.get('bms_token')+"&type=unReadCount";
                    var that = this;
                    jQuery.getJSON(URL,  function(tsv, state, xhr){
                        var data = jQuery.parseJSON(xhr.responseText);
                        that.newMessages = data[1];
                        that.$el.find('.messagesbtn sup').html(data[1]);
                     
                    });
               }

            });
        });
