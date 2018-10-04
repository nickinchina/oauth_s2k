/**
 * Module dependencies.
 */

var oauthServer = require('./lib');
var md5 = require('./lib/md5.js');
var Response = oauthServer.Response;
var util = require('util');
var model = require('./model');

// Create an Express application.

module.exports = function(app, passport){
  // Add OAuth server.
  app.oauth = new oauthServer({model: model});
  
  // Post token.
  app.post('/oauth/token', app.oauth.token());
  
  var login_redirect = function(req){
    return util.format('/oauth/login?redirect=%s&client_id=%s&redirect_uri=%s&response_type=%s', 
      req.path, req.query.client_id, req.query.redirect_uri,req.query.response_type);
  }
  var render_page = function(req, res, next, page){
    //sails._mixinResView(req,res,next);
    var locals = {
      redirect: req.query.redirect,
      client_id: req.query.client_id,
      response_type: req.query.response_type,
      redirect_uri: req.query.redirect_uri
    };
    return res.render(page+'/index.ejs', locals, function (err, renderedViewStr){
      if (err) {
        console.log(err)
        return res.json(400, err);
      }
      return res.send(renderedViewStr)
    });
    //return res.view(page+'/index.ejs', );
  }
  
  
  // Post authorization.
  app.all('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    var user = req.user;
    if (req.session.passport && req.session.passport.user && req.session.passport.user) user = req.session.passport.user;
    if (!user) return res.redirect(login_redirect(req));
    console.log('req.headers.authorization',req.headers.authorization)
    var authenticateHandler = {
      handle: function(request, response) {
        return user;
      }
    }
    return app.oauth.authorize({
      authenticateHandler:authenticateHandler,allowEmptyState:true
    })(req, res, next);
  });
  
  // Get login.
  app.get('/oauth/login', function(req, res, next) {
    return render_page(req, res, next, 'login');
  });
  
  // Post login.
  app.post('/oauth/login', function(req, res) {
    passport.authenticate('local', function(err, user, info) {
        var error = err || info;
        if (error) {
            return res.json(400, error);
        }
        req.logIn(user, function(err) {
            if (err) { return res.send(err); }
            
            return res.redirect(util.format('%s?client_id=%s&redirect_uri=%s&response_type=%s', 
              req.body.redirect, req.body.client_id, req.body.redirect_uri, req.body.response_type));
        });
    })(req, res);
    
  });
  
  app.get('/oauth/user',function(req, res) {
    var user = req.user;
    if (req.session.passport && req.session.passport.user && req.session.passport.user) user = req.session.passport.user;
    var hash = md5.createHash(user.email.toLowerCase());
    var avatar_url = 'https://secure.gravatar.com/avatar/' + hash;
    avatar_url += '?s=40&r=pg&d=identicon';
    var ouser = {
      id: user.id, name: user.name, username:user.email,state:'active',email:user.email,avatar_url:avatar_url
    }

    res.json(ouser);
    res.end();
  });
  
  // Get secret.
  app.get('/oauth/secret', app.oauth.authenticate(), function(req, res) {
    // Will require a valid access_token.
    res.send('Secret area');
  });
  
  app.get('/oauth/public', function(req, res) {
    // Does not require an access_token.
    res.send('Public area');
  });
}