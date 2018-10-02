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
  var render_page = function(req, res, next, page){
    sails._mixinResView(req,res,next);
    return res.view(page+'/index.ejs', {
      redirect: req.query.redirect,
      client_id: req.query.client_id,
      redirect_uri: req.query.redirect_uri
    });
  }
  // Get authorization.
  app.get('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    var user = req.user;
    if (req.session.passport && req.session.passport.user && req.session.passport.user) user = req.session.passport.user;
    if (!user) return res.redirect(login_redirect(req));
    return app.oauth.authorize()(req, res, next);
    //return res.json('{}')
    //return render_page(req, res, next, 'authorize');
  });
  
  // Post authorization.
  app.post('/oauth/authorize', function(req, res, next) {
    // Redirect anonymous users to login page.
    var user = req.user;
    if (req.session.passport && req.session.passport.user && req.session.passport.user) user = req.session.passport.user;
    if (!user) return res.redirect(login_redirect(req));
    return app.oauth.authorize()(req, res, next);
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
            return res.redirect(util.format('%s?client_id=%s&redirect_uri=%s', req.body.redirect, req.body.client_id, req.body.redirect_uri));
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