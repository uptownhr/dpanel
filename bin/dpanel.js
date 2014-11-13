#!/usr/bin/env node

var program = require('commander');
var dpanel = require('../lib/dpanel.js');
var forever = require('forever');
var prompt = require('prompt');
var Table = require('cli-table');
var exec = require('child_process').exec;

program.version('0.0.34');

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

    program.command('start <domain> [image]')
        .description('start a vhost with image')
        .option('-i, --image [image]','Specify [image] to create container with', 'wordpress')
        .action( function(domain,image,options){
            if(!image){
                dpanel.docker.containerExistsByName(domain).then(function(container){
                    dpanel.start(domain,container.Image)
                        .then(function(container){
                            console.log('started',container);
                        }).fail(console.log);
                }).fail(function(){
                    //
                    // Setting these properties customizes the prompt.
                    //
                    var repos = [
                        {id: 1, name: 'Wordpress', image: 'oskarhane/docker-wordpress-nginx-ssh'},
                        {id: 2, name: 'LEMP - PHP 5.6', image: 'jaequery/lemp'},
                        {id: 3, name: 'Drupal', image: 'b7alt/drupal'}
                    ];
                    message = "\nPick a number or type in a docker registry image\n\n".cyan;
                    repos.forEach(function(repo){
                        message += repo.id+": "+repo.name+" ("+repo.image+")\n";
                    });
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

                        image = result.name;
                        repos.forEach(function(repo){
                            if(repo.id == result.name){
                                image = repo.image;
                            }
                        });

                        console.log("You selected: ".cyan + image);

                        dpanel.start(domain,image)
                            .then(function(container){
                                console.log('started',container);
                            }).fail(console.log);
                    });
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

    program.command('keys <action>')
        .description("generate - creates ssh keys\n   copy - copies pubkey to a container of choice")
        .action(function(action){
	    switch(action){
	    case "generate":
		console.log("type this to generate your ssh keys: ssh-keygen -t rsa");
		break;
		/*
	    case "set":
		prompt.get({
                    properties: {
                        pubkey: {
                            description: "Paste your id_rsa.pub key"
                        }
                    }
                }, function (err, result) {
                    if(err){return err}
                    pubkey = result.pubkey;
		    if(pubkey != ''){
			exec("echo '"+pubkey+"' > ~/.ssh/id_rsa.pub", function (error, stdout, stderr) {
			    // output is in stdout
			    console.log("Pubkey saved");
			});
		    }else{
			console.log("Can't be empty, try again");
		    }
                });
		break;
		*/
	    case "copy":
		prompt.get({
                    properties: {
                        domain: {
                            description: "Type the name of domain you wish to copy the pubkey to"
                        }
                    }
                }, function (err, result) {
                    if(err){return err}
		    var domain = result.domain;
		    console.log('copying pubkey to container: ' +domain);
		    dpanel.docker.containerExistsByName(domain).then(function(container){
			var dest_path = '/var/lib/docker/aufs/mnt/'+container.Id+'/root/';
			exec("cp -Rfp ~/.ssh " + dest_path, function (error, stdout, stderr){
			    console.log('pubkey successfully copied');
			});
		    }).fail(console.log);

                });

		break;

	    }
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
