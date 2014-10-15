var Docker = require('dockerode');

var docker = new Docker({socketPath: '/var/run/docker.sock'});

module.exports = {

    init: function(){
        docker.pull('jwilder/nginx-proxy', function (err, stream) {
            stream.on('data', function(data){
                console.log(data.toString());
            });

            stream.on('end', function(data){
                docker.createContainer(
                    {
                        Image: 'jwilder/nginx-proxy',
                        name:'proxy',
                        'AttachStdin': true,
                        'AttachStdout': true,
                        'AttachStderr': true,
                        'Tty': true,
                        'OpenStdin': true,
                        'Detach': true
                    }, function(err,container){
                        if(err){
                            console.log(err);
                        }else{
                            container.start({
                                "Binds": ["/var/run/docker.sock:/tmp/docker.sock"],
                                "PublishAllPorts": true,
                                "PortBindings":{ "80/tcp": [{ "HostPort": "80" }] }
                            },function(err,data){
                                if(err){
                                    console.log(err,container.id);
                                }else{
                                    console.log('proxy started', container.id);
                                }
                            });
                        }
                    }
                )
            })
        });

    },

    start: function(domain,image){
        docker.pull(image, function (err, stream) {
            stream.on('data', function(data){
                console.log(data.toString());
            });

            stream.on('end', function(data){
                docker.createContainer(
                    {
                        Image: image,
                        name: domain,
                        'Tty': true,
                        'Detach': true,
                        'Env': ["VIRTUAL_HOST=" + domain]
                    }, function(err,container){
                        if(err){
                            console.log(err);
                        }else{
                            container.start(
                                function(err,data){
                                    if(err){
                                        console.log(err,container.id);
                                    }else{
                                        console.log('site started', domain, container.id);
                                    }
                                });
                        }
                    }
                )
            });
        });

    }

};