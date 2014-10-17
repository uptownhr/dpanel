var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var dpanel = require('./lib/dpanel.js');

var project = 'dpanel';
var port = 3100;
var app = express();

app.use(bodyParser.urlencoded({extended:false}))

app.use(session({
    secret: 'jujubee',
    store: new MongoStore({
        db: project
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365
    }
}));

app.use( function(req,res,next){
    var session = req.session;

    if(session.user){
        req.user = session.user
    }

    next();
});

app.get('/user', testing(), function(req,res){
    res.send(req.user);
});

app.post('/user/login', authenticate, function(req,res){
    res.send(req.user);
});

app.use(isAdmin);

app.get('/list', function(req,res){
    dpanel.list().then( function(containers) {
        res.send(containers);
    });
});

app.post('/stop/:domain', function(req,res){
    var domain = req.params.domain;
    dpanel.stop(domain).then( function(){
        res.send(['stopped',req.params]);
    }).fail( function(err){
        res.send(['error',err]);
    });
});

app.post('/start/:domain/:image?', function(req,res){
    var domain = req.params.domain;
    var image = req.params.image;

    switch(image){
        case 'wordpress':
            image = 'oskarhane/docker-wordpress-nginx-ssh';
            break;
        default:
            image = 'oskarhane/docker-wordpress-nginx-ssh';
    }

    dpanel.start(domain,image).then( function(container){
        res.send(
            ['started', container, req.params]
        );
    }).fail( function(container){
        res.send(
            ['already started', container, req.params]
        );
    });
});

app.listen(port, console.log);

function testing(){
    var testings = 'testing';
    return function testing(req,res,next){
        console.log(testings);
        next();
    }

}

function authenticate(req,res,next){
    req.user = req.session.user = {
        'username': 'test',
        'level': 'admin'
    }

    next();
}

function isAdmin(req,res,next) {
    try {
        if (req.user.level == 'admin') {
            next();
        }
    } catch (e) {
        res.send('unauthorized');
    }
}