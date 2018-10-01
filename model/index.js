
/**
 * Module dependencies.
 */

var sql = require('./sql.js');

/*
 * Get access token.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.getAccessToken = function(bearerToken) {
	var params = [
		{name:'token',type:'NVarChar',length:500,value:bearerToken},
		{name:'type',type:'TinyInt',value:0}
	];
	sql.query('hq.sp_oauth_get_token',params)
	.then(function(result) {
	 	var token = result.rows[0];
	  	return {
			accessToken: token.access_token,
			client: {id: token.client_id},
			expires: token.expires,
			user: {id: token.userId}, // could be any object
	  	};
	});
};

/**
 * Get refresh token.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.getRefreshToken = function(bearerToken) {
	var params = [
		{name:'token',type:'NVarChar',length:500,value:bearerToken},
		{name:'type',type:'TinyInt',value:1}
	];
	sql.query('hq.sp_oauth_get_token',params)
	.then(function(result) {
	 	var token = result.rows[0];
	 	//return result.rowCount ? result.rows[0] : false;
	  	return token;
	});
};

/**
 * Get client.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.getClient = function(clientId, clientSecret) {
	var params = [
		{name:'client_id',type:'NVarChar',length:500,value:clientId},
		{name:'client_secret',type:'NVarChar',length:500,value:clientSecret}
	];
	sql.query('hq.sp_oauth_get_client',params)
	.then(function(result) {
		var oAuthClient = result.rows[0];
		if (!oAuthClient) {
			return;
	 	}
	 	return {
	 		clientId: oAuthClient.client_id,
	 		clientSecret: oAuthClient.client_secret,
	 		grants: ['password']
	 	};
	});
};

/*
 * Get user.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.getUser = function(username, password) {
	sql.sp='';
	var params = [
		{name:'username',type:'NVarChar',length:100,value:username},
		{name:'password',type:'NVarChar',length:100,value:password}
	];
	sql.query('hq.sp_oauth_get_user', params)
	.then(function(result) {
		var user = result.rows[0];
	 	//return result.rowCount ? result.rows[0] : false;
	  	return user;
	});
};

/**
 * Save token.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.saveAccessToken = function(token, client, user) {
	var params = [
		{name:'access_token',type:'NVarChar',length:500,value:token.access_token},
		{name:'access_token_expires_on',type:'DateTime',value:token.access_token_expires_on},
		{name:'client_id',type:'NVarChar',length:500,value:client.id},
		{name:'refresh_token',type:'NVarChar',length:500,value:token.refresh_token},
		{name:'refresh_token_expires_on',type:'DateTime',value:token.refresh_token_expires_on},
		{name:'user_id',type:'Int',length:100,value:user.id}
	];
	sql.query('hq.sp_oauth_save_token', params)
	.then(function(result) {
		var token = result.rows[0];
		//return result.rowCount ? result.rows[0] : false;
		return token;
	});
};
