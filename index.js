var express   = require('express');
var url       = require('url');

// Configs
var PORT      = process.env.HTTP_PORT || 3000;
var AZK_UID   = process.env.AZK_UID;
var azkInstanceData = {
  seq: null,    // instance sequence
  uid: AZK_UID  // instance ID
};

// Database is configured
var client;
if (process.env.DATABASE_URL) {
  var redis   = require('redis');
  var options = url.parse(process.env.DATABASE_URL);
  client = redis.createClient(options.port, options.hostname);
}

// Create Express app
var app = express();

// Config app with simple logger middleware,
// simples locale, view engine and static assets
require('./config')(app);

// Which layout handlebars will render
var render = function(req, res, step) {
  var layout = (req.locale == 'pt_BR') ? 'index_pt_br' : 'index_en';
  // fill `seq` with the container that processed the request
  azkInstanceData.seq = process.env.AZK_SEQ;
  var options = {
    client: false,
    counter: false,
    step: step,
    azkData: azkInstanceData,
  };
  if (client) {
    // if database is plugged
    client.get('counter', function(err, counter) {
      if (err) console.error(err);
      counter = parseInt(counter || 0) + 1;
      client.set('counter', counter, function(err) {
        if (err) console.error(err);
        options.client  = true;
        options.counter = counter;
        res.render(layout, options);
      })
    });
  } else {
    res.render(layout, options);
  }
};

// Route
app.get('/', function(req, res) {
  var path = (!client) ? "/database" : "/commands";
  res.redirect(path);
});
app.get('/database', function(req, res) {
  render(req, res, "database");
});
app.get('/deploy', function(req, res) {
  render(req, res, "deploy");
});
app.get('/commands', function(req, res) {
  render(req, res, "commands");
});

app.listen(PORT);
console.log('Service %s is already done in port: %s', AZK_UID, PORT);
