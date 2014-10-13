var Docker = require('dockerode');

var docker = new Docker({socketPath: '/var/run/docker.sock'});

docker

module.exports = {

    init: function(){
        //start nginx-proxy
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
                        console.log(err,data);
                    });
                }
            }
        )
    },

    start: function(domain,image){
        console.log('wtf:',image);
        docker.createContainer(
            {
                Image: image,
                'Tty': true,
                'Detach': true,
                'Env': ["VIRTUAL_HOST=" + domain]
            }, function(err,container){
                if(err){
                    console.log(err);
                }else{
                    container.start(
                        function(err,data){
                            console.log(err,data);
                        });
                }
            }
        )
    }

};