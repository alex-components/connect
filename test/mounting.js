
process.env.NODE_ENV = 'test';

var connect = require('..');
var http = require('http');
var request = require('supertest');
var should = require('should');

describe('app.use()', function(){
  var app;

  beforeEach(function(){
    app = connect();
  });

  describe('with a connect app', function(){
    it('should mount', function(done){
      var blog = connect();

      blog.use(function(req, res){
        req.url.should.equal('/');
        res.end('blog');
      });

      app.use('/blog', blog);

      request(app)
      .get('/blog')
      .expect(200, 'blog', done);
    });

    it('should retain req.originalUrl', function(done){
      var app = connect();

      app.use('/blog', function(req, res){
        res.end(req.originalUrl);
      });

      request(app)
      .get('/blog/post/1')
      .expect(200, '/blog/post/1', done);
    });

    it('should adjust req.url', function(done){
      app.use('/blog', function(req, res){
        res.end(req.url);
      });

      request(app)
      .get('/blog/post/1')
      .expect(200, '/post/1', done);
    });

    it('should strip trailing slash', function(done){
      var blog = connect();
    
      blog.use(function(req, res){
        req.url.should.equal('/');
        res.end('blog');
      });
    
      app.use('/blog/', blog);

      request(app)
      .get('/blog')
      .expect('blog', done);
    });

    it('should set .route', function(){
      var blog = connect();
      var admin = connect();
      app.use('/blog', blog);
      blog.use('/admin', admin);
      app.route.should.equal('/');
      blog.route.should.equal('/blog');
      admin.route.should.equal('/admin');
    });

    it('should not add trailing slash to req.url', function(done) {
      app.use('/admin', function(req, res, next) {
        next();
      });

      app.use(function(req, res, next) {
        res.end(req.url);
      });

      request(app)
      .get('/admin')
      .expect('/admin', done);
    })
  })

  describe('with a node app', function(){
    it('should mount', function(done){
      var blog = http.createServer(function(req, res){
        req.url.should.equal('/');
        res.end('blog');
      });

      app.use('/blog', blog);

      request(app)
      .get('/blog')
      .expect('blog', done);
    });
  });

  describe('error handling', function(){
    it('should send errors to airty 4 fns', function(done){
      app.use(function(req, res, next){
        next(new Error('msg'));
      })
      app.use(function(err, req, res, next){
        res.end('got error ' + err.message);
      });

      request(app)
      .get('/')
      .expect('got error msg', done);
    })

    it('should stack error fns', function(done){
      app.use(function(req, res, next){
        next(new Error('msg'));
      })
      app.use(function(err, req, res, next){
        res.setHeader('X-Error', err.message);
        next(err);
      });
      app.use(function(err, req, res, next){
        res.end('got error ' + err.message);
      });

      request(app)
      .get('/')
      .expect('X-Error', 'msg')
      .expect(200, 'got error msg', done);
    })

    it('should invoke error stack even when headers sent', function(done){
      app.use(function(req, res, next){
        res.end('0');
        next(new Error('msg'));
      });
      app.use(function(err, req, res, next){
        done();
      });

      request(app)
      .get('/')
      .end(function(){});
    })
  })

  it('should be case insensitive (lower-case route, mixed-case request)', function(done){
    var blog = http.createServer(function(req, res){
      req.url.should.equal('/');
      res.end('blog');
    });

    app.use('/blog', blog);

    request(app)
    .get('/BLog')
    .expect('blog', done);
  });

  it('should be case insensitive (mixed-case route, lower-case request)', function(done){
    var blog = http.createServer(function(req, res){
      req.url.should.equal('/');
      res.end('blog');
    });

    app.use('/BLog', blog);

    request(app)
    .get('/blog')
    .expect('blog', done);
  });

  it('should be case insensitive (mixed-case route, mixed-case request)', function(done){
    var blog = http.createServer(function(req, res){
      req.url.should.equal('/');
      res.end('blog');
    });

    app.use('/BLog', blog);

    request(app)
    .get('/blOG')
    .expect('blog', done);
  });
});
