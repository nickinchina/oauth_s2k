/**
 * Module dependencies.
 */

var oauthServer = require('./lib');
var util = require('util');
var model = require('./model');

// Create an Express application.

module.exports = function(app, passport){
  // Add OAuth server.
  app.oauth = new oauthServer({model: model});
  
  // Post token.
  app.post('/oauth/token', app.oauth.token());
  
  var login_redirect = function(req){
    return util.format('/oauth/login?redirect=%s&client_id=%s&redirect_uri=%s', req.path, req.query.client_id, req.query.redirect_uri);
  }
  var render_page = function(req, res, page){
    return res.view(page, {
      redirect: req.query.redirect,
      client_id: req.query.client_id,
      redirect_uri: req.query.redirect_uri
    });
  }
  // Get authorization.
  app.get('/oauth/authorize', function(req, res) {
    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
      return res.redirect(login_redirect(req));
    }
    return render_page(req, res, 'authorize');
  });
  
  // Post authorization.
  app.post('/oauth/authorize', function(req, res) {
    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
      return res.redirect(login_redirect);
    }
    return app.oauth.authorize();
  });
  
  // Get login.
  app.get('/oauth/login', function(req, res) {
    return render_page(req, res, 'login');
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
            return res.redirect(util.format('/%s?client_id=%s&redirect_uri=%s', req.body.redirect, req.query.client_id, req.query.redirect_uri));
        });
    })(req, res);
    
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