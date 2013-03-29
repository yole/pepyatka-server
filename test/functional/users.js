var request = require('supertest')
  , assert = require('assert')
  , agent = require('superagent')
  , async = require('async')

var redis = require('../../db')
  , db = redis.connect()

var server = require('../../server')
  , models = require('../../app/models')

describe('Users API', function() {
  var userAgent;

  before(function(done) {
    var newUser = new models.User({
      username: 'username',
      password: 'password'
    })
    newUser.save(function(err, user) {
      userAgent = agent.agent();
      userAgent
        .post('localhost:' + server.get('port') + '/session')
        .send({ username: 'username', password: 'password' })
        .end(function(err, res) {
          done()
        });
    })
  })

  it('GET /v1/users/:username/subscriptions should return subscritions of user', function(done) {
    models.User.findAnon(function(err, anonymous) {
      models.User.findByUsername('username', function(err, user) {
        anonymous.getPostsTimeline({start: 0}, function(err, timeline) {
          userAgent
            .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
            .end(function(err, res) {
              request(server)
                .get('/v1/users/' + user.username + '/subscriptions')
                .end(function(err, res) {
                  assert(res.body.length > 0)
                  done()
                })
            })
        })
      })
    })
  })

  it('GET /v1/users/:username/subscribers should return subscribers of user', function(done) {
    models.User.findAnon(function(err, anonymous) {
      anonymous.getPostsTimeline({start: 0}, function(err, timeline) {
        userAgent
          .post('localhost:' + server.get('port') + '/v1/timeline/' + timeline.id + '/subscribe')
          .end(function(err, res) {
            request(server)
              .get('/v1/users/anonymous/subscribers')
              .end(function(err, res) {
                assert(res.body.length > 0)
                done()
              })
          })
      })
    })
  })

  it('GET /v1/users/user-not-exist/subscriptions should return 422', function(done) {
    request(server)
      .get('/v1/users/user-not-exist/subscriptions')
      .expect(422, done)
  })

  it('GET /v1/users/user-not-exist/subscribers should return 422', function(done) {
    request(server)
      .get('/v1/users/user-not-exist/subscribers')
      .expect(422, done)
  })
})
