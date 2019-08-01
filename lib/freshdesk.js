var crypto = require('crypto');
var util = require('util');

var mixin  = {
    GetFreshUrl : function(redirect_uri, user){
        return mixin.GetFreshUrlRaw(redirect_uri, '8279f5e1e3f6a3bbf4709814a9d56ee6', user.name, user.email)
    },
    GetFreshUrlRaw:function ( baseUrl,  secret,  name,  email) {
        var d = new Date();
        var userTimezoneOffset = d.getTimezoneOffset() * 60000;
        d = new Date(d.getTime() - userTimezoneOffset);
        var timems = d/1000;
        
        return util.format("%s/login/sso?name=%s&email=%s&timestamp=%s&hash=%s", 
            baseUrl, encodeURIComponent(name), encodeURIComponent(email), timems, mixin.GetHash(secret, name, email, timems))
     },

    GetHash: function ( secret,  name,  email,  timems) {
        var hmac = crypto.createHmac("md5", secret);
        var input = name + secret + email + timems;
        hmac.update(input);   
        var crypted = hmac.digest("hex");
        return crypted;
    }
}

module.exports = mixin;