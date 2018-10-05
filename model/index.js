
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
		if (result.length==0) return false;
	 	var token = result[0];
	 	console.log('getAccessToken',token)
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
	 		console.log('getRefreshToken',result)
		 	return result.length>0?result[0]:false;
		})
		.catch(function (err) {
	      console.log("getUser - Err: ", err)
	    });
};

/**
 * Get client.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.getClient = function(clientId, clientSecret) {
	
	var params = [
		{name:'client_id',type:'NVarChar',length:80,value:clientId},
		{name:'client_secret',type:'NVarChar',length:80,value:clientSecret}
	];
	return sql.query('hq.sp_oauth_get_client',params)
		.then(function(result) {
			if (result.length==0) return false;
		 	var oAuthClient = result[0];
		 	console.log('getClient',result)
		 	return {
		 		clientId: oAuthClient.client_id,
		 		clientSecret: oAuthClient.client_secret,
		 		redirectUris: oAuthClient.redirect_uri?oAuthClient.redirect_uri.split('|'):[],
		 		grants: ['password','authorization_code','refresh-token']
		 	};
		})
		.catch(function (err) {
	      console.log("getUser - Err: ", err)
	    });
};

/*
 * Get user.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.getUser = function(username, password) {
	var params = [
		{name:'username',type:'NVarChar',length:100,value:username},
		{name:'password',type:'NVarChar',length:100,value:password}
	];
	return sql.query('hq.sp_oauth_get_user', params)
		.then(function(result) {
			console.log('getUser',result)
			return result.length>0?result[0]:false;
		})
		.catch(function (err) {
	      console.log("getUser - Err: ", err)
	    });
};

/**
 * Save token.
 */

//Modified by Lucky, on Oct.1,2018
module.exports.saveToken = module.exports.saveAccessToken = function(token, client, user) {
	var params = [
		{name:'access_token',type:'NVarChar',length:500,value:token.accessToken},
		{name:'access_token_expires_on',type:'DateTime',value:token.accessTokenExpiresAt},
		{name:'client_id',type:'NVarChar',length:80,value:client.clientId},
		{name:'refresh_token',type:'NVarChar',length:500,value:token.refreshToken},
		{name:'refresh_token_expires_on',type:'DateTime',value:token.refreshTokenExpiresAt},
		{name:'user_id',type:'Int',value:user.id}
	];
	return sql.query('hq.sp_oauth_save_token', params)
		.then(function(result) {
			console.log('saveAccessToken',result)
			var r = result.length>0?result[0]:false;
			r.client = client;
			r.user = user;
			return r;
		})
		.catch(function (err) {
	      console.log("saveAccessToken - Err: ", err)
	    });
};

module.exports.getAuthorizationCode = function(code) {
  var params = [
    {name:'code',type:'NVarChar',length:256,value:code}
  ];
  return sql
    .query("hq.sp_get_oauth_authorization_code", params)
    .then(function (result) {
			console.log('getAuthorizationCode',result)
      if (result.length==0) return false;
      var authCodeModel = result[0];
      var client = JSON.parse(authCodeModel.OAuthClient) ;
      var user = JSON.parse(authCodeModel.User);
      return {
        code: code,
        authorizationCode: code,
        client: client,
        expiresAt: authCodeModel.expires,
        redirectUri: client.redirect_uri,
        user: user,
        scope: authCodeModel.scope,
      };
    }).catch(function (err) {
      console.log("getAuthorizationCode - Err: ", err)
    });
}

module.exports.saveAuthorizationCode = function(code, client, user) {
	
	var params = [
	    {name:'client_id',type:'NVarChar',length:80,value:client.clientId},
	    {name:'authorization_code',type:'NVarChar',length:256,value:code.authorizationCode},
	    {name:'user_id',type:'Int',value:user.id},
	    {name:'expires',type:'DateTime',value:code.expiresAt},
	    {name:'scope',type:'NVarChar',length:100,value:code.scope}
	];
  return sql
    .query("hq.sp_set_oauth_authorization_code", params)
    .then(function () {
      code.code = code.authorizationCode
      return code;
    }).catch(function (err) {
      console.log("saveAuthorizationCode - Err: ", err)
    });
}

module.exports.revokeAuthorizationCode =function (code) {
	var params = [
    {name:'code',type:'NVarChar',length:256,value:code.code}
  ];
  return sql
    .query("hq.sp_del_oauth_authorization_code", params)
    .then(function () {
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    var expiredCode = code
    expiredCode.expiresAt = new Date('2015-05-28T06:59:53.000Z')
    return expiredCode
  }).catch(function (err) {
    console.log("revokeAuthorizationCode - Err: ", err)
  });
}

module.exports.revokeToken = function (token) {
	var params = [
    {name:'code',type:'NVarChar',length:256,value:token.refreshToken}
  ];
  return sql
    .query("hq.sp_oauth_del_token", params)
    .then(function () {
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    var expiredToken = token
    expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
    return expiredToken
  }).catch(function (err) {
    console.log("revokeToken - Err: ", err)
  });
}