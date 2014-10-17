#!/usr/bin/env node

var program = require('commander');
var dpanel = require('../lib/dpanel.js');


program.version('0.0.4');

program.command('init')
    .description('initialize dpanel images')
    .action( function(){
        dpanel.init();
    });

program.command('start <domain>')
    .description('start a vhost with image')
    .option('-i, --image [image]','Specify [image] to create container with', 'wordpress')
    .action( function(domain,options){
        switch(options.image){
            case 'wordpress':
                image = 'oskarhane/docker-wordpress-nginx-ssh';
                break;
            default: image = options.image;
        }
        dpanel.start(domain,image)
            .then(function(container){
                console.log('started',container);
            }).fail(console.log);
    });

program.command('stop <domain>')
    .description('stop a site')
    .action(function(domain){
        dpanel.stop(domain).then(console.log,console.log);
    })

program.command('list')
    .description('list available sites')
    .action( function(){
        dpanel.list().then( function(containers){
            containers.forEach( function(container){
                console.log(container.Names[0],container.Status);
            })
        })
    })



program.parse(process.argv);

if(process.argv.length == 2){
    program.help();
}