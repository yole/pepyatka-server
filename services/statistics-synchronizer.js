var models = require('./../app/models')
  , db = require('../db').connect()
  , async = require('async')

var startCheckingUsers = function() {
  db.keys('user:*', function(err, usersIdKeys) {
    async.forEach(usersIdKeys,
      function(usersIdKey, callback) {
        var userId;
        usersIdKey = usersIdKey.replace(/user:/, '');
        if (!/:(\w)+/.test(usersIdKey)) {
          userId = usersIdKey;
          models.User.findById(userId, function(err, user) {
            if (user) {
              models.Stats.findByUserId(userId, function(err, stats) {
                if (stats) {
                  async.parallel([
                    function(done){
                      updateSubscriptions(user, done)
                    },
                    function(done) {
                      updatePosts(user, done)
                    },
                    function(done) {
                      updateComments(user, done)
                    },
                    function(done) {
                      updateLikes(user, done)
                    },
                    function(done) {
                      updateSubscribers(user, done)
                    },
                    function(done) {
                      updateDiscussions(user, done)
                    }
                  ], function(err) {
                    callback(err)
                  })
                } else {
                  callback(null)
                }
              })
            } else {
              callback(null)
            }
          })
        }
      },
      function(err) {
        if(err) console.log(err)
        else console.log('Statistics synchronization was complete');//TODO Fix this. The message is displayed before the synchronization is complete
      })
  })
}

var updatePosts = function(user, callback) {
  user.getPostsTimeline(function(err, timeline) {
    if (timeline) {
      timeline.getPostsCount(function(err, count) {
        if (count) {
          db.hset('stats:' + user.id, 'posts', count, function(err, stats) {
            db.zadd('stats:posts', count, user.id, function(err, res) {
              callback(err)
            })
          })
        } else {
          callback(null)
        }
      })
    } else {
      callback(null)
    }
  })
}

var updateComments = function(user, callback) {
  user.getCommentsTimeline(function(err, timeline) {
    if (timeline) {
      timeline.getCommentsCount(function(err, count) {
        if (count) {
          db.hset('stats:' + user.id, 'comments', count, function(err, stats) {
            db.zadd('stats:comments', count, user.id, function(err, res) {
              callback(err)
            })
          })
        } else {
          callback(null)
        }
      })
    } else {
      callback(null)
    }
  })
}

var updateLikes = function(user, callback) {
  user.getLikesTimeline(function(err, timeline) {
    if (timeline) {
      timeline.getLikesCount(function(err, count) {
        if (count) {
          db.hset('stats:' + user.id, 'likes', count, function(err, stats) {
            db.zadd('stats:likes', count, user.id, function(err, res) {
              callback(err)
            })
          })
        } else {
          callback(null)
        }
      })
    } else {
      callback(null)
    }
  })
}

var updateDiscussions = function(user, callback) {
//  user.getLikesTimeline(function(err, timeline) {
//    if (timeline) {
//      timeline.getLikesCount(function(err, count) {
//        if (count) {
//          db.hset('stats:' + user.id, 'likes', count, function(err, stats) {
//            db.zadd('stats:likes', count, user.id, function(err, res) {
//              callback(err)
//            })
//          })
//        } else {
//          callback(null)
//        }
//      })
//    } else {
//      callback(null)
//    }
//  })
  callback(null)
}

var updateSubscribers = function(user, callback) {
  user.getPostsTimeline(function(err, timeline) {
    if (timeline) {
      timeline.getSubscribers(function(err, subscribers) {
        if (subscribers) {
          db.hset('stats:' + user.id, 'subscribers', subscribers.length, function(err, stats) {
            db.zadd('stats:subscribers', subscribers.length, user.id, function(err, res) {
              callback(err)
            })
          })
        } else {
          callback(null)
        }
      })
    } else {
      callback(null)
    }
  })
}

var updateSubscriptions = function(user, callback) {
  user.getSubscriptionsCount(function(err, count) {
    if (count) {
      db.hset('stats:' + user.id, 'subscriptions', count, function(err, stats) {
        db.zadd('stats:subscriptions', count, user.id, function(err, res) {
          callback(err)
        })
      })
    } else {
       callback(null)
    }
  })
}

exports.startSynchronization = function() {
  startCheckingUsers();
}