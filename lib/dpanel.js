var Docker = require('dockerode');
var q = require('q');
var _ = require('underscore');
var forever = require('forever');

Docker.prototype.imageExists = function(img){
    var self = this;
    return q.Promise( function(resolve,fail,notify){
        self.listImages( function(err,images){
            var image_res;

            var res = images.some( function(image){
                var img_name = image.RepoTags[0];
                image_res = image;
                return (img_name.indexOf(img) > -1)
            });

            if(res){
                resolve(image_res);
            }else{
                fail(img);
            }
        });
    });
}

Docker.prototype.containerExistsByName = function(cont){
    var self = this;
    return q.Promise( function(resolve,fail,notify){
        self.listContainers({all:1},function(err,containers){
            var container_res;

            var res = containers.some(function(container){
                container_res = container;
                return container.Names.some( function(name){
                    return (name == '/'+cont)
                });
            });

            if(res){
                resolve(container_res);
            }else{
                fail('container does not exist');
            }
        })
    });
}

var docker = new Docker({socketPath: '/var/run/docker.sock'});

function startContainer(domain,image,createOptions,startOptions){
    return q.Promise( function(resolve,reject,notify){
        docker.containerExistsByName(domain).then(function(container){
            if(container.Status.indexOf('Exit') > -1){
                var new_container = docker.getContainer(container.Id);
                new_container.start(function(err,data){
                    if(err){
                        reject(err);
                    }else{
                        resolve(new_container);
                    }
                });
            }else{
                reject(['already started',container]);
            }

        }).fail( function(){

            var default_options = {
                Image: image,
                name: domain,
                'Tty': true,
                'Detach': false,
                'Env': ["VIRTUAL_HOST=" + domain]
            };

            var opt = _.extend(default_options,createOptions);

            docker.createContainer(opt, function(err,container){
                    var default_start_options = {};
                    var opt = _.extend(default_start_options,startOptions);
                    if(err){
                        reject(err);
                    }else{
                        container.start(opt,
                            function(err,data){
                                if(err){
                                    reject(err);
                                }else{
                                    resolve(container);
                                }
                            });
                    }
                }
            )
        })
    });
}


function pullImage(image){
    return q.promise( function(resolve,reject){

        docker.imageExists(image)
            .then(function(){
                resolve();
            }).fail( function(){
                console.log('pullImage', image);

                docker.pull(image, function(err,stream){
                    var error = false;

                    if(err){
                        console.log('err',err);
                        reject(err);
                    }

                    stream.on('data', function(data){
                        var response = JSON.parse(data.toString());

                        if(response.errorDetail != undefined){
                            error = response;
                        }else{
                            console.log(response);
                        }
                    });

                    stream.on('end', function(data){
                        if(error){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                });
            })
    })
}

module.exports = {

    init: function(){
        return this.start('proxy','jwilder/nginx-proxy',
            {
                'Volumes': { "/tmp/docker.sock": {} },
                "ExposedPorts": { "80/tcp": {}}
            },
            {
                'Binds': ["/var/run/docker.sock:/tmp/docker.sock:rw"],
                'PortBindings': { "80/tcp": [{"HostPort": "80"}]}
            }
        );
    },
    start: function(domain,image,createOptions,startOptions){
        return pullImage(image).then(function () {
            return startContainer(domain, image, createOptions, startOptions);
        });
    },
    list: function(){
        return q.promise( function(resolve,reject){
            docker.listContainers( function(err, containers){
                if(err) reject(err);

                resolve(containers);
            })
        });
    },
    stop: function(domain){
        return q.promise( function(resolve,reject){
            docker.containerExistsByName(domain)
                .then( function(container){
                    docker.getContainer(container.Id).stop( function(err){
                        if(err) reject(err);
                        resolve('container stopped');
                    });
                })
                .fail(reject)
        });
    },
    delete: function(domain){
        var self = this;
        return q.promise( function(resolve,reject){
            docker.containerExistsByName(domain)
                .then( function(container){
                    if(container.Status.indexOf('Exit') != -1){
                        docker.getContainer(container.Id).remove( function(err){
                            if(err) reject(err);
                            resolve('domain deleted');
                        });
                    }else{
                        self.stop(domain)
                            .then(function(res){
                                docker.getContainer(container.Id).remove( function(err){
                                    if(err) reject(err);
                                    resolve('domain deleted');
                                })
                            })
                    }


                })
                .fail(reject);
        });
    }
};