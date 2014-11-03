#!/usr/bin/env node

var program = require('commander');
var dpanel = require('../lib/dpanel.js');
var forever = require('forever');
var prompt = require('prompt');
var Table = require('cli-table');

program.version('0.0.31');

dpanel.init().finally( function(){
    forever.list(false,function(err,processes,a){
        var running = false;
        if(processes){
            running = processes.some( function(process){
                return (process.file == '../api.js');
            });
        }

        if(!running){
            var child = forever.startDaemon('../api.js',{
                max: 3,
                silent: true,
                options: []
            });
        }
    });

    /*program.command('init')
        .description('initialize dpanel images')
        .action( function(){
            dpanel.init().then(console.log).fail(console.log).done(function(){


            });
        });*/

    /*program.command('init-api')
        .description('starts api server')
        .action( function(){
            dpanel.start_api().then(function(res){
                console.log(res);
            });
        });*/

    program.command('start <domain> [image]')
        .description('start a vhost with image')
        .option('-i, --image [image]','Specify [image] to create container with', 'wordpress')
        .action( function(domain,image,options){
            if(!image){
                //
                // Setting these properties customizes the prompt.
                //
                message = "\nOops! Please choose an image to start the server with. Here are some examples to choose from\n\n".cyan;
                message += "Pick a number or the docker registry image name\n";
                message += "1: oskarhane/docker-wordpress-nginx-ssh\n";
                message += "2: jaequery/lemp\n\n";
                console.log(message);
                /*prompt.delimiter = "\n".green;*/

                prompt.get({
                    properties: {
                        name: {
                            description: ":".magenta
                        }
                    }
                }, function (err, result) {
                    if(err){return err}
                    switch (result.name){
                        case '1': image = 'oskarhane/docker-wordpress-nginx-ssh'; break;
                        case '2': image = 'jaequery/lemp'; break;
                        default: image = result.name;
                    }
                    console.log("You selected: ".cyan + image);

                    dpanel.start(domain,image)
                        .then(function(container){
                            console.log('started',container);
                        }).fail(console.log);
                });
            }else{
                dpanel.start(domain,image)
                    .then(function(container){
                        console.log('started',container);
                    }).fail(console.log);
            }


        });

    program.command('stop <domain>')
        .description('stop a site')
        .action(function(domain){
            dpanel.stop(domain).then(console.log,console.log);
        })

    program.command('delete <domain>')
        .description('delete a site')
        .action(function(domain){
            dpanel.delete(domain).then(console.log,console.log);
        })

    program.command('list')
        .description('list available sites')
        .action( function(){
            dpanel.list().then( function(containers){
                var table = new Table({
                    head: ['Domain'.cyan,'Image'.cyan,'Uptime'.cyan]
                });
                containers.forEach( function(container){
                    table.push(
                        [container.Names[0].substring(1),container.Image, container.Status]
                    );

                    //console.log(container.Names[0].substring(1),'\t\t\t - using: ',container.Image,container.Status);
                });
                console.log(table.toString());
            })
        })



    program.parse(process.argv);

    if(process.argv.length == 2){
        program.help();
    }
})