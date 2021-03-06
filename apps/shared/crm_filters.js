/*
 *Created by : Umair Shahid
 *Version: 1 
 *=================================*/

!function ($) {
  "use strict"; 

  var CRMFilters = function (element, options) {
    this.init(element, options)
  }

  CRMFilters.prototype = {

    constructor: CRMFilters

  , init: function (element, options) {           
      this.$element = $(element)
      this.options = this.getOptions(options)            
      this.objType = this.options.object
      this.$element.append($(this.options.template))
      if(this.options.showAdvanceOption){
        this.adv_options = $(this.options.adv_option)
        this.$element.append($(this.options.adv_option))
        
       
      }
      this.fields = []
      this.rules = []
      
      var self = this;
      
      addFilterRow()
       
      function addFilterRow(){
        var  basicFilter = $('<li><a class="btn-green"><span class="filter"></span> Add Filter </a></li>')
       
        var add_filter_row = $(self.options.bottomrow_c);
        self.$element.find(".filter-div").append(add_filter_row)
        //adding different filter to add row
        add_filter_row.find("ul").append(basicFilter)
               
        //Attaching events to filter buttons
        basicFilter.on("click",$.proxy(self.addBasicFilter,self))
        
      }
      if(this.options.showAdvanceOption){
            this.$element.find('input').iCheck({
                  checkboxClass: 'checkinput'
            })

            this.$element.find('input').on('ifChecked', function(event){
                  self.$element.find(".advncfilter .filter-cont").show();
            })
            this.$element.find('input').on('ifUnchecked', function(event){
                  self.$element.find(".advncfilter .filter-cont").hide();
            })
      }
      
    }
  , addBasicFilter:function(obj,e,params){
      if(this.$element.find(".filter-div ._row").length===this.options.maxFilter){
          this.options.app.showAlert("You can't add more than 8 filter rows.",$("body"),{fixed:true});
      }
      var filter = $(this.options.filterRow)
      var value_display='block',matchValue=''
      matchValue = (params && params.fieldValue)?params.fieldValue :""
      filter.addClass("filter")           
      var filter_html = '<div class="btn-group"><select data-placeholder="Choose a Field" class="selectbox fields" disabled="disabled"><option>Loading Fields...</option>'                        
          filter_html +='</select></div>'          
          filter_html +='<div class="btn-group rules-container"><select data-placeholder="Choose Match Type" class="selectbox rules" disabled="disabled"><option value="">Loading...</option>'                      
          filter_html +='</select></div>'                              
          filter_html += '<div class="btn-group value-container" style="display:'+value_display+'"><input type="text" value="'+matchValue+'" name="" class="matchValue" style="width:140px;" /></div>'
      
      filter.find(".filter-cont").append(filter_html)
      this.addActionBar(filter)
      var self = this 
      if(this.$element.find(".filter-div ._row").length>=1){
          var condition_row = $(this.options.condition_row);
          this.$element.find(".addfilter").before(condition_row)
          if(this.options.filterFor==="S"){
            condition_row.find("select").chosen({disable_search: "true",width:'100px'}).change(function(){ 
                  $(this).val($(this).val())
                  $(this).trigger("chosen:updated")
                  self.updateAdvanceFilter()
            })
          }
          else if(this.options.filterFor==="N"){
              condition_row.find(".btn-group").html('<button data-toggle="dropdown" class="btn dropdown-toggle" style="padding:1px 12px">And</button>')
          }
      }
      
      filter.find(".fields").chosen({width:'200px'}).change(function(){
           var rule_html = ""
           if(self.options.filterFor==="S"){        
                var attr_type = $(this).find("option:selected").attr("field_type").toLowerCase()	
                $.each(self.rules,function(key,val){
                     if(attr_type==val.type.toLowerCase()){
                          rule_html +='<option value="'+val.name+'" rule_type="'+val.type+'">'+val.label+'</option>'                           
                     }           
                })
                filter.find(".rules").html(rule_html).prop("disabled",false).trigger("chosen:updated")
                self.updateAdvanceFilter()
           }
      })
      filter.find(".rules").chosen({disable_search: "true",width:'170px'}).change(function(){
          $(this).val($(this).val())
          $(this).trigger("chosen:updated")  
           self.updateAdvanceFilter()
      })
      this.$element.find(".addfilter").before(filter)
      this.showTooltips(filter)
      filter.find(".matchValue").keyup(function(){
          self.updateAdvanceFilter()
      })      
      
      //Load Elements 
      if(this.options.filterFor==="S"){
          this.addSalesForceField(filter,params)
          this.addSalesForceRules(filter,params)
      }
      else if(this.options.filterFor==="N"){
          this.addNetSuiteField(filter,params)
          this.addNetSuiteRules(filter,params)
      }
      
    }
  ,addSalesForceField:function(filter,params){
      var URL = ""
      var self = this
      var selected_field = ""
      if(this.fields.length===0){
          URL = "/pms/io/salesforce/getData/?BMS_REQ_TK="+this.options.app.get('bms_token')+"&type=filterFields";
          jQuery.getJSON(URL,  function(tsv, state, xhr){
                if(xhr && xhr.responseText){                        
                     var fields_json = jQuery.parseJSON(xhr.responseText);                                
                     if(self.options.app.checkError(fields_json)){
                         return false;
                     }       
                    var field_html ='<option value=""></option>'                                            
                    $.each(fields_json.fldList[0],function(key,val){
                        selected_field = (params && params.fieldName==val[0].name) ? "selected" : ""                        
                        if(self.objType && self.objType===val[0].sfObject.toLowerCase()){
                            self.fields.push(val[0])                                  
                            field_html +='<option value="'+val[0].name+'" '+selected_field+' field_type="'+val[0].type+'">'+val[0].label+'</option>'                           
                        }
                        
                    });
                    
                    filter.find(".fields").html(field_html).prop("disabled",false).trigger("chosen:updated")
                }
          }).fail(function() { console.log( "error in loading fields" ); });
      }
      else{
          var field_html ='<option value=""></option>'                                            
          $.each(this.fields,function(key,val){
                selected_field = (params && params.fieldName==val[0].name) ? "selected" : ""                
                field_html +='<option value="'+val.name+'" '+selected_field+' field_type="'+val.type+'">'+val.label+'</option>'                           

            })
        filter.find(".fields").html(field_html).prop("disabled",false).trigger("chosen:updated")
      }
  }
  ,addSalesForceRules:function(filter,params){
      var URL = ""
      var self = this
      var selected_field = ""
      if(this.rules.length===0){
          URL = "/pms/io/salesforce/getData/?BMS_REQ_TK="+this.options.app.get('bms_token')+"&type=getOperators";
          jQuery.getJSON(URL,  function(tsv, state, xhr){
                if(xhr && xhr.responseText){                        
                     var fields_json = jQuery.parseJSON(xhr.responseText);                                
                     if(self.options.app.checkError(fields_json)){
                         return false;
                     }       
                    var rule_html =''                                            
                    $.each(fields_json.fldList[0],function(key,val){
                        selected_field = (params && params.fieldCondition==val[0].name) ? "selected" : ""                        
                        self.rules.push(val[0])                            
                        if(val[0].type=="string"){
                            rule_html +='<option value="'+val[0].name+'" '+selected_field+' rule_type="'+val[0].type+'">'+val[0].label+'</option>'                           
                        }
                        
                    });                    
                    filter.find(".rules").html(rule_html).prop("disabled",false).trigger("chosen:updated")
                }
          }).fail(function() { console.log( "error in loading fields" ); });
      }
      else{
          var rule_html =''                                            
          $.each(this.rules,function(key,val){
                selected_field = (params && params.fieldCondition==val[0].name) ? "selected" : ""                                                              
                if(val.type=="string"){
                    rule_html +='<option value="'+val.name+'" '+selected_field+' rule_type="'+val.type+'">'+val.label+'</option>'                           
                }
            })
          filter.find(".rules").html(rule_html).prop("disabled",false).trigger("chosen:updated")
      }
  }
  ,addNetSuiteField:function(filter,params){
      var URL = ""
      var self = this
      var selected_field = ""
      if(this.fields.length===0){
          URL = "/pms/io/netsuite/getData/?BMS_REQ_TK="+this.options.app.get('bms_token')+"&type=filterFields";
          jQuery.getJSON(URL,  function(tsv, state, xhr){
                if(xhr && xhr.responseText){                        
                     var fields_json = jQuery.parseJSON(xhr.responseText);                                
                     if(self.options.app.checkError(fields_json)){
                         return false;
                     }       
                    var field_html ='<option value=""></option>'                                            
                    $.each(fields_json.fldList[0],function(key,val){
                        selected_field = (params && params.fieldName==val[0].name) ? "selected" : ""                        
                        self.fields.push(val[0])                            
                        field_html +='<option value="'+val[0].name+'" '+selected_field+' >'+val[0].label+'</option>'                           
                        
                    });
                    
                    filter.find(".fields").html(field_html).prop("disabled",false).trigger("chosen:updated")
                }
          }).fail(function() { console.log( "error in loading fields" ); });
      }
      else{
          var field_html ='<option value=""></option>'                                            
          $.each(this.fields,function(key,val){
                selected_field = (params && params.fieldName==val[0].name) ? "selected" : ""                
                field_html +='<option value="'+val.name+'" '+selected_field+' >'+val.label+'</option>'                           

            })
        filter.find(".fields").html(field_html).prop("disabled",false).trigger("chosen:updated")
      }
  }
  ,addNetSuiteRules:function(filter,params){
      var URL = ""
      var self = this
      var selected_field = ""
      if(this.rules.length===0){
          URL = "/pms/io/netsuite/getData/?BMS_REQ_TK="+this.options.app.get('bms_token')+"&type=getOperators";
          jQuery.getJSON(URL,  function(tsv, state, xhr){
                if(xhr && xhr.responseText){                        
                     var fields_json = jQuery.parseJSON(xhr.responseText);                                
                     if(self.options.app.checkError(fields_json)){
                         return false;
                     }       
                    var rule_html =''                                            
                    $.each(fields_json.oprList[0],function(key,val){
                        selected_field = (params && params.fieldCondition==val[0].name) ? "selected" : ""                        
                        self.rules.push(val[0])                                                    
                        rule_html +='<option value="'+val[0].name+'" '+selected_field+' >'+val[0].label+'</option>'                           
                        
                        
                    });                    
                    filter.find(".rules").html(rule_html).prop("disabled",false).trigger("chosen:updated")
                }
          }).fail(function() { console.log( "error in loading fields" ); });
      }
      else{
          var rule_html =''                                            
          $.each(this.rules,function(key,val){
                selected_field = (params && params.fieldCondition==val[0].name) ? "selected" : ""                                                                              
                rule_html +='<option value="'+val.name+'" '+selected_field+' >'+val.label+'</option>'                           
                
            })
          filter.find(".rules").html(rule_html).prop("disabled",false).trigger("chosen:updated")
      }
  }
  , addActionBar:function(filterRow){
      var action =  $('<div class="right-btns"></div>')            
      var del_btn = $('<a title="Delete Filter" class="btn-red showtooltip"><i class="icon delete "></i></a>')      
      action.append(del_btn)            
      del_btn.click(function(){
         if($(this).parents(".filter-row").index()==0){
             $(this).parents(".filter-row").next("span").remove() 
         }
         $(this).parents(".filter-row").prev("span").remove() 
         $(this).parents(".filter-row").remove()
      });
      filterRow.find(".filter-cont").append(action)    
            
  },
   updateAdvanceFilter:function(){
       if(this.options.filterFor==="S"){ 
         var _target = this.$element
         var total_rows = _target.find(".filter-div ._row");  
         var query = "";
         var condition = "";
         for (var i=0;i<total_rows.length;i++){
             if($(total_rows[i]).find(".fields").val()!="" && $(total_rows[i]).find(".rules").val()!='none' && $(total_rows[i]).find(".matchValue").val()!==""){
                 if(i!=0){
                     query += " "+condition+" "
                 }
                 query += (i+1);
                 condition = $(total_rows[i]).next("span.andor").find("select").val()
             }
         }        
         this.$element.find(".advance-option").val(query);
       }
    }
  ,
  loadFilters:function(data){
      var _target = this.$element
      var self = this
      _target.find(".filter-div ._row").remove()      
      if(data.filterFields){
      var filters_data = data.filterFields[0]
        $.each(filters_data,function(i,v){
            var filter =  v[0]
            if(self.options.filterFor=='N'){
              if(v[0].nsObject.indexOf(self.objType)>-1){
                self.addBasicFilter(false,false,filter)                    
              }  
            }
            else{
              if(v[0].sfObject==self.objType){
                self.addBasicFilter(false,false,filter)                    
              }
            }
        })
        if(self.options.filterFor=="S"){            
            var adv_option = self.objType=="lead"?"advancedOptionsL":"advancedOptionsC"
            this.$element.find(".advance-option").val(data[adv_option])
        }
      }
  },
  initFilters:function(){
      var _target = this.$element
      _target.find(".filter-div ._row").remove()      
      _target.find(".filter-div span.andor").remove()      
  },
  saveFilters:function(src){      
      var filters_post = {}
      if(this.options.filterFor==="S"){
          filters_post = this.saveSalesForce(src)
      }
      else if(this.options.filterFor==="N"){
          filters_post = this.saveNetSuite(src)
      }
      return filters_post
  }
  ,saveSalesForce:function(src){
      var filters_post = {}
      var _target = this.$element
      var total_rows = _target.find(".filter-div ._row");               
      for(var i=0;i<total_rows.length;i++){
          var N = i+1
          var filter = $(total_rows[i])
          if($(total_rows[i]).hasClass("filter")){
              filters_post[src+"Field"+N] = filter.find(".fields").val()
              filters_post[src+"FieldCondition"+N] = filter.find(".rules").val()
              filters_post[src+"FieldValue"+N] = filter.find(".matchValue").val()
              if(filter.next("span.andor").length==1){
                filters_post[src+"ANDOR"+N] = filter.next("span.andor").find("select").val()
              }
              var adv_option = this.$element.find(".advance-option")
              if($.trim(adv_option.val())!==""){
                var _src = src=="lead"?"L":"C"
                filters_post["advancedOptions"+_src] = $.trim(adv_option.val())
              }
          }
      }
      return filters_post
  }
  ,saveNetSuite:function(src){
     src = "search" 
     var filters_post = {}
      var _target = this.$element
      var total_rows = _target.find(".filter-div ._row");               
      for(var i=0;i<total_rows.length;i++){
          var N = i+1
          var filter = $(total_rows[i])
          if($(total_rows[i]).hasClass("filter")){
              filters_post[src+"Field"+N] = filter.find(".fields").val()
              filters_post[src+"Operator"+N] = filter.find(".rules").val()
              filters_post[src+"Value"+N] = filter.find(".matchValue").val()                            
          }
      }
      return filters_post 
  }
  , getOptions: function (options) {
      options = $.extend({}, $.fn.crmfilters.defaults, options)    
      return options
    }
  , showTooltips:function(filter){
      filter.find(".showtooltip").tooltip({'placement':'bottom',delay: { show: 0, hide:0 },animation:false})      
  }
  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }
  }

 /* FILTER PLUGIN DEFINITION
  * ========================= */

  $.fn.crmfilters = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('crmfilters')
        , options = typeof option == 'object' && option
      if (!data) $this.data('crmfilters', (data = new CRMFilters(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.crmfilters.Constructor = CRMFilters

  $.fn.crmfilters.defaults = {
    
    template: '<div class="timeline"><div class="filter-div"></div></div>'
  , bottomrow_c : '<div class="filter-row filter-menu addfilter"><ul></ul></div>'
  , condition_row : '<span class="andor"><div class="btn-group"><select><option value="AND">And</option><option value="OR">Or</option></select></div></span>'
  , filterRow : '<div class="filter-row _row"><div class="head-icon"><span class="icon filter"></span></div><div class="filter-cont"></div></div>'
  , adv_option : '<div class="advncfilter"><div class="inputlabel" style=""><input type="checkbox" id="campaign_isFooterText" class="checkinput"><label for="campaign_isFooterText">Advanced Filter</label></div><div class="filter-cont"><input type="text" value="" class="advance-option" /></div></div>'
  , filterFor : 'S'
  , title: ''
  , app:null
  ,maxFilter:8,
  showAdvanceOption:true
  }

}(window.jQuery);