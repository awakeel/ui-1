/* 
 * Name:  Notification Views
 * Date: 04 June 2014
 * Author: Pir Abdul Wakeel
 * Description: Notification View
 * Dependency: Notifications
 */
define(['text!autobots/html/tag.html', 'target/views/recipients_target', 'bms-tags', 'target/models/recipients_target'],
        function(template, recipientView, tags, ModelRecipient) {
            'use strict';
            return Backbone.View.extend({
                className: "botpanel",
                tagName: "div",
                events: {
                    "click .add-targets": "loadTargets",
                    "click .add-tag": "chooseTags"
                },
                initialize: function() {
                    this.template = _.template(template);
                    this.app = this.options.app;
                    this.dialog = this.options.dialog;
                    this.targetsModel = null;
                    if (typeof this.options.model != "undefined" && this.options.model.get('actionData')[0].actionTags != "")
                        this.tags = this.options.model.get('actionData')[0].actionTags.split(',');
                    else
                        this.tags = "";

                    this.filterNumber = null;
                    if (typeof this.options.model != "undefined") {
                        this.status = this.options.model.get('status');
                        this.botId = this.options.model.get('botId.encode');
                        this.filterNumber = this.options.model.get('filterNumber.encode');
                    } else {
                        this.botId = this.options.botId;
                        this.status = "D";
                        this.botType = this.options.botType;
                    }
                    this.mainTags = "";
                    this.render();
                },
                render: function() {
                    this.$el.html(this.template());
                    this.$el.find('input[type=checkbox]').iCheck({
                        checkboxClass: 'checkpanelinput',
                        insert: '<div class="icheck_line-icon"></div>'
                    });
                    if (this.options.type == "edit") {
                        this.getTargets();
                        this.options.model.get('isRecur') == "Y" ? this.$el.find("#chckIsRecur").iCheck('check') : this.$el.find("#chckIsRecur").iCheck('uncheck');
                        this.$el.find("#ddlRecurType").val(this.options.model.get('recurType'));
                        this.$el.find("#txtRecurPeriod").val(this.options.model.get('recurPeriod'));
                        this.$el.find("#txtRecurTimes").val(this.options.model.get('recurTimes'));
                        this.options.model.get('isSweepAll') == "Y" ? this.$el.find("#chkIsSweepAll").iCheck('check') : this.$el.find("#chkIsSweepAll").iCheck('uncheck');
                        ;
                        this.updateTags(true); // first time when load. then false the save.
                    } else {
                        this.updateTags(false);
                    }

                    this.showTags();
                    this.dialog.$(".dialog-title").addClass('showtooltip').attr('data-original-title', "Click here to name ").css('cursor', 'pointer');
                    this.dialog.$("#dialog-title span").click(_.bind(function(obj) {
                        if (this.status != "D")
                            return false;
                        this.showHideTargetTitle(true);
                    }, this));

                    this.dialog.$(".savebtn").click(_.bind(function(obj) {
                        this.saveTemplateName(obj)
                    }, this));

                    this.dialog.$(".cancelbtn").click(_.bind(function(obj) {
                        if (this.botId) {
                            this.showHideTargetTitle();
                        }
                    }, this));
                    this.$el.find("#ddlRecurType").chosen({no_results_text: 'Oops, nothing found!', width: "100px", disable_search: "true"});
                    this.$el.find("#txtRecurTimes").chosen({no_results_text: 'Oops, nothing found!', style: "float:none!important", width: "120px", disable_search: "true"});
                    this.dialog.$(".showtooltip").tooltip({'placement': 'bottom', delay: {show: 0, hide: 0}, animation: false});
                    this.$(".showtooltip").tooltip({'placement': 'bottom', delay: {show: 0, hide: 0}, animation: false});

                },
                loadTargets: function() {
                    var dialog_object = {title: 'Select Targets',
                        css: {"width": "1200px", "margin-left": "-600px"},
                        bodyCss: {"min-height": "423px"},
                        headerIcon: 'targetw'
                    }
                    var dialog = this.options.app.showDialog(dialog_object);

                    this.options.app.showLoading("Loading Targets...", dialog.getBody());

                    require(["target/recipients_targets"], _.bind(function(page) {
                        var targetsPage = new page({page: this, dialog: dialog, editable: true, type: "autobots", showUseButton: true});
                        dialog.getBody().html(targetsPage.$el);
                    }, this));

                },
                getStatus: function() {

                    if (this.status == "D")
                        return ["Paused", "pclr1"];
                    else if (this.status == "R")
                        return ["Playing", "pclr18"];
                    else if (this.status == "P")
                        return ["Pending", "pclr6"];
                },
                showTags: function() {
                    this.modal = $('.modal');
                    var tags = "";
                    if (typeof this.options.model != "undefined")
                        tags = this.options.model.get('tags');
                    this.modal.find('.modal-header').removeClass('ws-notags');
                    this.tagDiv = this.modal.find(".tagscont");
                    var labels = this.getStatus();
                    this.head_action_bar = this.modal.find(".modal-header .edited  h2");
                    this.head_action_bar.append("<a style='margin-top: 10px; margin-left: -10px;' class='cstatus " + labels[1] + "'>" + labels[0] + "</a>");
                    this.head_action_bar.find(".pointy").css({'padding-left': '10px', 'margin-top': '4px'});
                    if (this.status == "D") {
                        this.head_action_bar.find(".edit").addClass('play').addClass('change-status').removeClass('edit').addClass('showtooltip').attr('data-original-title', "Click to Play").css('cursor', 'pointer');
                    } else {
                        this.head_action_bar.find(".edit").addClass('pause').addClass('change-status').removeClass('edit').addClass('showtooltip').attr('data-original-title', "Click to Pause").css('cursor', 'pointer');
                    }
                    var that = this;
                    if (this.status != "D") {
                        this.head_action_bar.find(".delete").hide();
                    }
                    this.head_action_bar.find(".copy").addClass('showtooltip').attr('data-original-title', "Click to Copy").css('cursor', 'pointer');
                    this.head_action_bar.find(".delete").addClass('showtooltip').attr('data-original-title', "Click to Delete").css('cursor', 'pointer');
                    this.head_action_bar.find(".change-status").on('click', function() {
                        var res = false;
                        if (that.status == "D") {
                            res = that.options.refer.playAutobot('dialog', that.botId);
                        } else {
                            res = that.options.refer.pauseAutobot('dialog', that.botId);
                        }
                    })
                    this.head_action_bar.find(".copy").on('click', function() {
                        that.options.refer.cloneAutobot('dialog', that.botId);
                    });
                    this.head_action_bar.find(".delete").on('click', function() {
                        if (that.options.refer.deleteAutobot('dialog', that.botId, that.$el)) {
                            that.options.dialog.hide();
                        }
                    });
                    this.tagDiv.addClass("template-tag").show();
                    this.tagDiv.tags({app: this.options.app,
                        url: '/pms/io/trigger/saveAutobotData/?BMS_REQ_TK=' + this.options.app.get('bms_token'),
                        params: {type: 'tags', botId: this.botId, tags: ''}
                        , showAddButton: true,
                        tags: tags,
                        callBack: _.bind(this.newTags, this),
                        typeAheadURL: "/pms/io/user/getData/?BMS_REQ_TK=" + this.options.app.get('bms_token') + "&type=allTemplateTags"
                    });
                },
                newTags: function(tags) {
                    if (typeof this.options.model != "undefined") {
                        this.options.model.set('tags', tags);
                    } else {
                        this.mainTags = tags;
                    }
                },
                saveTagAutobot: function(close) {
                    if (this.status != "D") {
                        this.options.refer.pauseAutobot(('dialog', this.botId));
                        return;
                    }
                    var that = this;
                    that.tags = "";
                    this.$el.find('#divtags ul li').each(function() {
                        var checksum = $(this).attr('checksum');
                        if (checksum !== "undefined") {
                            that.tags = that.tags + checksum + ",";
                        }
                    });
                    var isRecur = this.$el.find("#chckIsRecur").is(':checked') ? "Y" : "N";
                    var recurType = this.$el.find("#ddlRecurType").val();
                    var recurPeriod = this.$el.find("#txtRecurPeriod").val();
                    var recurTimes = this.$el.find("#txtRecurTimes").val();
                    var isSweepAll = this.$el.find("#chkIsSweepAll").is(':checked') ? "Y" : "N";
                    var post_data = {tags: this.mainTags, botId: this.options.botId, type: "update", isRecur: isRecur, recurType: recurType, recurPeriod: recurPeriod, recurTimes: recurTimes, isSweepAll: isSweepAll, actionTags: this.tags};
                    var URL = "/pms/io/trigger/saveAutobotData/?BMS_REQ_TK=" + this.options.app.get('bms_token');
                    var result = false;
                    var that = this;
                    $.post(URL, post_data)
                            .done(function(data) {
                                var _json = jQuery.parseJSON(data);
                                if (_json[0] !== "err") {
                                    that.app.showMessge(_json[1]);
                                    if (!close) {
                                        that.options.refer.getAutobotById(that.botId);
                                        that.options.dialog.hide();
                                        if (typeof that.options.botType != "undefined") {
                                            that.options.refer.options.listing.fetchBots();
                                        }
                                    }
                                }
                                else {
                                    that.app.showAlert(_json[1], $("body"), {fixed: true});


                                }
                                return result;
                            });
                },
                loadTagTargets: function() {
                    var remove_cache = true;
                    var offset = 0;
                    var that = this;
                    var _data = {offset: offset, type: 'list_csv', filterNumber_csv: this.options.model.get('filterNumber.encode')};
                    this.tracks_bms_request = this.targetsRequest.fetch({data: _data, remove: remove_cache,
                        success: _.bind(function(collection, response) {
                            // Display items
                            if (that.app.checkError(response)) {
                                return false;
                            }

                            for (var s = offset; s < collection.length; s++) {
                                this.targetsModel = collection.at(s);
                            }
                            that.createTargets();
                        }, this),
                        error: function(collection, resp) {

                        }
                    });
                },
                createTargets: function(save) {
                    var that = this;
                    if (this.targetsModel.get('filterNumber.encode')) {
                        this.$el.find("#autobot_targets_grid tbody").children().remove();
                        that.$el.find('#autobot_targets_grid tbody').append(new recipientView({type: 'autobots_listing', model: this.targetsModel, app: that.options.app}).el);
                        that.$el.find('#autobot_targets_grid tbody tr td .remove-target').on('click', function() {
                            that.targetsModel = null;
                            that.changeTargetText();
                            that.$el.find('#autobot_targets_grid tbody').html('');
                            that.loadTargets();
                        });
                        if (that.status != "D")
                            that.disableAllEvents();
                    }
                    if (save) {
                        this.saveTargets()
                    }
                    this.changeTargetText();
                },
                addToCol2: function(model) {
                    this.targetsModel = model;
                    this.createTargets(true);

                },
                saveTargets: function() {
                    var URL = "/pms/io/trigger/saveAutobotData/?BMS_REQ_TK=" + this.app.get('bms_token');
                    var filterNumbers = this.targetsModel.get('filterNumber.encode');
                    var that = this;
                    $.post(URL, {type: 'targets', botId: this.options.botId, filterNumber: filterNumbers})
                            .done(_.bind(function(data) {
                                that.app.showLoading(false, that.$el);
                                var _json = jQuery.parseJSON(data);
                                if (_json[0] !== 'err') {
                                    that.app.showMessge(_json[1]);
                                }
                                else {
                                    that.app.showAlert(_json[0], $("body"), {fixed: true});
                                }
                            }, this));
                },
                getTargets: function() {
                    var that = this;
                    var bms_token = that.options.app.get('bms_token');
                    this.filterNumber = this.options.model.get('filterNumber.encode');
                    if (this.filterNumber == "") {
                        return;
                    }
                    var URL = "/pms/io/filters/getTargetInfo/?BMS_REQ_TK=" + bms_token + "&filterNumber=" + this.filterNumber + "&type=get";
                    jQuery.getJSON(URL, function(tsv, state, xhr) {
                        var data = jQuery.parseJSON(xhr.responseText);
                        if (that.app.checkError(data)) {
                            return false;
                        }
                        var objRecipients = new ModelRecipient(data);
                        that.targetsModel = objRecipients;
                        that.targets = data;
                        that.changeTargetText();
                        that.createTargets();

                    });
                },
                chooseTags: function() {

                    var dialog_object = {title: 'Select Tags',
                        css: {"width": "1200px", "margin-left": "-600px"},
                        bodyCss: {"min-height": "423px"},
                        headerIcon: 'targetw'
                    }
                    dialog_object["buttons"] = {saveBtn: {text: 'Done'}};
                    var dialog1 = this.options.app.showDialog(dialog_object);
                    var that = this;
                    that.tags = that.tags.toString().split(',');
                    this.options.app.showLoading("Loading Tags...", dialog1.getBody());
                    require(["tags/tags"], _.bind(function(page) {
                        var Tags = new page({tags: that.tags, app: that.options.app, camp: that, dialog: dialog1, editable: true, type: "autobots"});
                        dialog1.getBody().html(Tags.$el);
                        // Tags.init();                         
                        dialog1.saveCallBack(_.bind(Tags.saveTags, Tags));
                        //  targetsPage.createRecipients(this.targetsModelArray);
                    }, this));



                },
                updateTags: function(firstTime) {
                    var str = "<div id='tagslist' class='tagscont tagslist'>";
                    str = str + "<ul>";
                    var tags = this.tags;
                    if (tags != '' && !$.isArray(tags)) {
                         tags = tags.toString().split(',');
                    }
                    for (var i = 0; i < tags.length; i++) {

                        str = str + "<li id='li_" + i + "' class='action' checksum='" + tags[i] + "'>";
                        str = str + "<a style='min-width: 120px;' class='tag'><span>" + tags[i] + "</span></a>";
                        //str = str + "<strong class='badge' style='line-height:35px!important;'>1</strong>";
                        str = str + "<a class='btn-red move-row dont-use showtooltip' data-original-title='Click to remove this tag'>";
                        str = str + "<span>Remove</span><i class='icon cross'></i></a>";
                        str = str + "</li>";
                    }
                    str = str + "</ul>";

                    str = str + "  <a  class='addtag add btn-green add-tag '  style='margin:4px 10px 0px;'>";
                    str = str + "<span class='right'>Add Tag</span><i class='icon plus left'></i></a> ";
                    str = str + "</div>";
                    var that = this;
                    this.$el.find("#divtags").html(str);
                    this.$el.find("#divtags .dont-use").on('click', function() {
                        if (that.options.model.get('status') != "D")
                            return false;
                        $(this).parents("li.action").remove();
                    });

                    if (!firstTime && tags != "") {
                        this.tags = tags.join(",");
                        this.saveTagAutobot(true);
                    }
                },
                changeTargetText: function() {
                    if (this.targetsModel) {
                        $(this.el).find("#hrfchangetarget").html("Change Target");
                        $(this.el).find(".no-target-defined").hide();
                    } else {
                        $(this.el).find(".no-target-defined").show();
                        $(this.el).find("#hrfchangetarget").hide("");
                    }
                },
                recurTimes: function() {
                    var options = "";
                    for (var i = 1; i < 31; i++) {
                        options = options + "<option value='" + i + "'>" + i + "</option>";
                    }
                    var recurTimes
                    if (typeof this.options.model != "undefined") {
                        var recurTimes = this.options.model.get('recurTimes');
                    }
                    if (i == recurTimes)
                        options = options + "<option value='0' selected='selected'> Unlimited </option>";
                    else
                        options = options + "<option value='0'> Unlimited </option>";

                    return options;
                },
                saveTemplateName: function(obj) {
                    var _this = this;
                    var name = $(obj.target).parents(".edited").find("input");
                    var dailog_head = this.dialog;
                    var URL = "/pms/io/trigger/saveAutobotData/?BMS_REQ_TK=" + this.app.get('bms_token');
                    $(obj.target).addClass("saving");
                    $.post(URL, {type: "rename", label: name.val(), botId: this.botId})
                            .done(function(data) {
                                var _json = jQuery.parseJSON(data);
                                if (_json[0] !== "err") {
                                    dailog_head.$("#dialog-title span").html(_this.app.encodeHTML(name.val()));
                                    _this.showHideTargetTitle();
                                    _this.app.showMessge("Autobot Renamed");
                                    //_this.page.$("#template_search_menu li:first-child").removeClass("active").click();
                                    _this.options.model.set("name", name.val());
                                }
                                else {
                                    _this.app.showAlert(_json[1], _this.$el);

                                }
                                $(obj.target).removeClass("saving");
                            });
                },
                showHideTargetTitle: function(show, isNew) {
                    if (show) {
                        this.dialog.$("#dialog-title").hide();
                        this.dialog.$("#dialog-title-input").show();
                        this.dialog.$(".template-tag").hide();
                        this.dialog.$("#dialog-title-input input").val(this.app.decodeHTML(this.dialog.$("#dialog-title span").html())).focus();
                    }
                    else {
                        this.dialog.$("#dialog-title").show();
                        this.dialog.$("#dialog-title-input").hide();
                        this.dialog.$(".tagscont").show();
                    }
                },
                disableAllEvents: function() {

                    this.$el.find("#hrfchangetarget").on('click', function() {
                        return false;
                    });
                    this.$el.find(".add-tag").on('click', function() {
                        return false;
                    });
                    this.$el.find(".add-targets").on('click', function() {
                        return false;
                    });
                    //that.$el.find('#autobot_targets_grid tbody tr td .remove-target');('click',function(){return false;});
                    this.modal = $('.modal');
                    this.modal.find('.modal-header').find("#dialog-title span").on('click', function() {
                        return false;
                    });
                    this.modal.find('.modal-header').find(".addtag").on('click', function() {
                        return false;
                    });
                    var btnSave = this.modal.find('.modal-footer').find('.btn-save');
                    //btnSave.removeClass('btn-save');
                    btnSave.find('.save').addClass('pause').removeClass('save');
                    btnSave.find('span').html("Pause");
                }

            });
        });


