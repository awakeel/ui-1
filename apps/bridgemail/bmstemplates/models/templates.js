/////////////////////////////////////////////////////////////////////////////////////////////////////////
 //
//         Templates Gallery Model
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////

define(['backbone', 'app'], function (Backbone, app) {
	'use strict';
	return Backbone.Model.extend({
		idAttribute: "_id",
		urlRoot: '/pms/io/campaign/saveUserTemplate/',
		url: function () {
                    return Backbone.Model.prototype.url.call(this) + '?BMS_REQ_TK=' + app.get('bms_token')+ '&type=create';
		}
	});
});
