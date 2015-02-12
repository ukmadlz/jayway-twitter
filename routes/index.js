var express = require('express');
var router = express.Router();
var Cloudant = require('cloudant');

if (process.env.VCAP_SERVICES) {
  // Running on Bluemix. Parse the port and host that we've been assigned.
  var env = JSON.parse(process.env.VCAP_SERVICES);
  console.log('VCAP_SERVICES: %s', process.env.VCAP_SERVICES);
  // Also parse Cloudant settings.
  var cloudant = env['cloudantNoSQLDB'][0]['credentials'];
  var cloudant_user = cloudant.username;
  var cloudant_pass = cloudant.password;
} else {
  var cloudant_user = 'CLOUDANTACCOUNT';
  var cloudant_pass = 'PASSWORD';
}

/* GET home page. */
router.get('/:twitter', function(req, res) {
  var twitterHandle = req.params.twitter;
  var Twitter = require('twitter');

  var client = new Twitter({
      consumer_key: 'CONSUMERKEY',
      consumer_secret: 'CONSUMERSECRET',
      // This can be generated via OAuth or from the http://apps.twitter.com dashboard
      access_token_key: 'ACCESSTOKENKEY',
      access_token_secret: 'ACCESSTOKENSECRET'
  });

  var params = {
    screen_name: twitterHandle,
    count: 200
  };
  client.get('statuses/user_timeline', params, function(error, tweets, response){
    if (!error) {
      Cloudant({account:cloudant_user, password:cloudant_pass}, function(er, cloudant) {
        cloudant.db.create(twitterHandle, function() {
          var database = cloudant.db.use(twitterHandle);
          for(i=0;i<tweets.length;i++){
            database.insert(tweets[i], tweets[i].id_str, function(err, body, header) {
              if (err)
                return console.log('['+twitterHandle+'.insert] ', err.message)

              console.log('you have inserted the tweet.')
              console.log(body)
            });
          }
        });
      });
      //console.log(tweets);
      var tweetText = '';
      for(i=0;i<tweets.length;i++){
        tweetText = tweetText+' '+tweets[i].text;
      }
      res.send(tweetText);
      // res.json(tweets);
    } else {
      console.log(error);
      console.log(response.req._header);
      res.render('index', { title: 'ERROR' });
    }
  });

  //res.render('index', { title: 'Express' });
});

module.exports = router;
