/**
 * Module dependencies.
 */

var oauthServer = require('./lib');
var md5 = require('./lib/md5.js');
var Response = oauthServer.Response;
var util = require('util');
var model = require('./model');
var basicAuth = require('./lib/basicAuth');
var freshdesk = require('./lib/freshdesk')
var jwt = require('jsonwebtoken');

// Create an Express application.

module.exports = function(app, passport){
  // Add OAuth server.
  app.oauth = new oauthServer({model: model});
  
  // Post token.
  app.post('/oauth/token', function(req, res, next){
    console.log('/oauth/token', req.body, req.queryl)
    if (req.query.client_id=='839266495191'){
      req = {
        query:{},
        body: req.query,
        headers: req.headers,
        method: req.method
      }
      req.headers['Content-Type']= 'application/x-www-form-urlencoded';
      //req.headers['Content-Length'] = req.body.length;
    }
    return app.oauth.token()(req, res, next)
  });
  
  var login_redirect = function(req){
    return util.format('/oauth/login?redirect=%s&client_id=%s&redirect_uri=%s&response_type=%s&state=%s', 
      req.path, req.query.client_id, req.query.redirect_uri,req.query.response_type,req.query.state);
  }
  
  var render_page_simple = function(res, page, locals){
    return res.render(page+'/index.ejs', locals, function (err, renderedViewStr){
      if (err) {
        console.log(err)
        return res.json(400, err);
      }
      return res.send(renderedViewStr)
    });
  }
  
  var render_page = function(req, res, next, page, param_alt){
    //sails._mixinResView(req,res,next);
    var locals = {
      redirect: req.query.redirect,
      client_id: req.query.client_id,
      response_type: req.query.response_type,
      redirect_uri: req.query.redirect_uri,
      state: req.query.state
    };
    if (!!param_alt) {
      Object.keys(param_alt).forEach(function(key){
        locals[key] = param_alt[key]
      })
    }
    if (!locals.hasOwnProperty('error')) locals.error = null;
    return render_page_simple(res, page, locals);
    //return res.view(page+'/index.ejs', );
  }
  
  
  // Post authorization.
  app.all('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    var user = req.user;
    var authenticateHandler = function(u){
      return {
        handle: function(request, response) {
          return u;
        }
      }
    };
    
    if (req.session.passport && req.session.passport.user && req.session.passport.user) user = req.session.passport.user;
    if (!user){
      var buser = basicAuth(req);
      if (!!buser && !buser.name && !buser.pass) {
        return passport.authenticate('basic', function(err, user, info) {
            var error = err || info;
            if (error) return res.send(400, error);
            req.logIn(user, function(err) {
              if (err) return res.send(400, err);
              return app.oauth.authorize({
                authenticateHandler:authenticateHandler(user),allowEmptyState:true
              })(req, res, next);
            });
        })(req, res);
      }
      else 
        //return res.redirect(login_redirect(req));
        return render_page_simple(res, 'redirect', {redirect_uri:login_redirect(req)});
    }
    
    if (req.query.state=="freshdesk"){
      var fd_url= freshdesk.GetFreshUrl(req.query.redirect_uri, user)
      return res.redirect(fd_url)
    }
    
    return app.oauth.authorize({
      authenticateHandler:authenticateHandler(user),allowEmptyState:true
    })(req, res, next);
  });
  
  app.get('/oauth/logout', function (req, res) {
      req.logout();
      
      var host_url = req.query.host_url;
      if (!!host_url) {
        if (host_url.substr(0,5)!="https")
          host_url = "https://" + host_url;
        return res.redirect(host_url)
      }
      else
        return res.json(200, 'ok');
  });
  
  // Get login.
  app.get('/oauth/login', function(req, res, next) {
    return render_page(req, res, next, 'login');
  });
  
  // Get forget pass.
  app.get('/oauth/forgot', function(req, res, next) {
    return render_page(req, res, next, 'forgot');
  });
  
  // Get forget pass.
  app.post('/oauth/forgot', function(req, res, next) {
    return render_page(req, res, next, 'forgot');
  });
  
  // Post login.
  app.post('/oauth/login', function(req, res, next) {
    var body = req.body;
    var client_id = body.client_id;
    var is_electron = body.client_id == "electron";
    
    passport.authenticate('local', function(err, user, info) {
        var error = err || info;
        if (error) {
          body.error = error.message;
          return render_page(req, res, next, 'login', body);
        }
        req.logIn(user, function(err) {
          if (err) { 
            body.error = err.message;
            return render_page(req, res, next, 'login', body);
          }
          
          if (is_electron) return render_page(req, res, next, 'postlogin', {state:user.id});
          
          if (body.state=="freshdesk"){
            var fd_url= freshdesk.GetFreshUrl(body.redirect_uri, user)
            return res.redirect(fd_url)
          }
          else
            return res.redirect(util.format('%s?client_id=%s&redirect_uri=%s&response_type=%s&state=%s', 
              body.redirect, body.client_id, body.redirect_uri, body.response_type, body.state));
        });
    })(req, res);
    
  });
  
  

  var user_func = function(return_type) {
    return function(req, res) {
      console.log('user api', req.headers, req.url)
      var token = req.headers.authorization;
      if (!!token) token = token.substr('Bearer '.length);
      else token = req.query.access_token;
      if (token) {
        return model.getAccessToken(token)
        .then(function(t){
          try {
            var user = JSON.parse(t.user) ;
            return_type = return_type || 0;
            switch (return_type) {
              case 1:
                res.json({id:user.id});
                break;
              case 2:
                var ouser = {id: user.id, email:user.email}
                var jwt_secret = process.env.JWT_SECRET;
                if (!!jwt_secret) 
                  ouser.data = jwt.sign({"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": user.email}, jwt_secret, { expiresIn: '1h' });

                res.json(ouser);
                break;
              default:
                //var hash = md5.createHash(user.email.toLowerCase());
                // var avatar_url = 'https://secure.gravatar.com/avatar/' + hash;
                // avatar_url += '?s=40&r=pg&d=identicon';
                var avatar_url = null;
                var username = (user.account+':'+user.name.replace(' ','_')).toLowerCase();
                var ouser = {
                  id: user.id, name: user.name, username:username,state:'active',
                  avatar_url:avatar_url,web_url:'',
                  "created_at" : "0000-00-00T00:00:00.000Z",
                  "bio" : null,"location" : null,"skype" : "","linkedin" : "","twitter" : "","website_url" : "","organization" : null,
                  "last_sign_in_at" : "0000-00-00T00:00:00.000Z","confirmed_at" : "0000-00-00T00:00:00.000Z","last_activity_on" : null,
                  email:user.email,"theme_id" : 1,"color_scheme_id" : 1,"projects_limit" : 100000,"current_sign_in_at" : "0000-00-00T00:00:00.000Z",
                  "identities" : [{"provider" : "s2k","extern_uid" : 1}],
                  "can_create_group" : true,"can_create_project" : true,"two_factor_enabled" : false,"external" : false,"shared_runners_minutes_limit": null
                }
                res.json(ouser);
                break;
            }
              
            res.end();
            
          } catch (ex){
            console.log('xxxxxxx',ex)
            res.json(400, { error: "empty request" });
            res.end();
          }
        })
        
      } 
      else {
        res.json(400, { error: "empty request" });
        res.end();
      }
      
    }
  }
  
  app.get('/api/v4/user',user_func());
  app.get('/api/v3/user',user_func());
  app.get('/api/v2/user',user_func(2));
  app.get('/api/v1/user',user_func(1));
  app.get('/.well-known/apple-app-site-association', function(req, res){
    return {
        "applinks": {
            "apps": [],
            "details": [
                {
                    "appID": "org.reactjs.native.example.s2k5",
                    "paths": [ "/s2k/*", "/oauth/authorize"]
                }
            ]
        }
    }
  })
  // // Get secret.
  // app.get('/oauth/secret', app.oauth.authenticate(), function(req, res) {
  //   // Will require a valid access_token.
  //   res.send('Secret area');
  // });
  
  // app.get('/oauth/public', function(req, res) {
  //   // Does not require an access_token.
  //   res.send('Public area');
  // });
}