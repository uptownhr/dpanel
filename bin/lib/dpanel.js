"use strict";
var Docker = require('dockerode');
var q = require('q');
var _ = require('underscore');
var DockerMachine = require('dockermachine-cli-js');
var stdout = process.stdout;

require("babel/polyfill");

var machine = new DockerMachine();

Docker.prototype.imageExists = function (img) {
  var self = this;
  return q.Promise(function (resolve, fail, notify) {
    self.listImages(function (err, images) {
      var image_res;

      var res = images.some(function (image) {
        var img_name = image.RepoTags[0];
        image_res = image;
        return img_name.indexOf(img) > -1;
      });

      if (res) {
        resolve(image_res);
      } else {
        fail(img);
      }
    });
  });
};

Docker.prototype.containerExistsByName = function (cont) {
  var self = this;
  return q.Promise(function (resolve, fail, notify) {
    self.listContainers({
      all: 1
    }, function (err, containers) {
      var container_res;

      var res = containers.some(function (container) {
        container_res = container;
        return container.Names.some(function (name) {
          return name == '/' + cont;
        });
      });

      if (res) {
        resolve(container_res);
      } else {
        fail('container does not exist');
      }
    });
  });
};

//need to connect to http using certs
var docker = new Docker({
  socketPath: '/var/run/docker.sock'
});

function startContainer(domain, image, createOptions, startOptions) {
  return q.Promise(function (resolve, reject, notify) {
    docker.containerExistsByName(domain).then(function (container) {
      if (container.Status.indexOf('Exit') > -1) {
        var new_container = docker.getContainer(container.Id);
        new_container.start(function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(new_container);
          }
        });
      } else {
        reject(['already started', container]);
      }
    }).fail(function () {
      docker.createContainer(createOptions, function (err, container) {
        if (err) {
          reject(err);
        } else {
          container.start(startOptions, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(container);
            }
          });
        }
      });
    });
  });
}

function pullImage(image) {
  return q.promise(function (resolve, reject) {

    docker.imageExists(image).then(function () {
      resolve();
    }).fail(function () {
      console.log('pullImage', image);

      docker.pull(image, function (err, stream) {
        var error = false;

        if (err) {
          console.log('err', err);
          reject(err);
        }

        stream.on('data', function (data) {
          var response = JSON.parse(data.toString());

          if (response.errorDetail != undefined) {
            error = response;
          } else {
            console.log(response);
          }
        });

        stream.on('end', function (data) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

function hostReady() {
  var machines, dpanel, started, create_response, response, start_response, active_response;
  return regeneratorRuntime.async(function hostReady$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(machine.command('ls'));

      case 2:
        machines = context$1$0.sent;
        context$1$0.next = 5;
        return regeneratorRuntime.awrap(machines.machineList.find(function (machine) {
          return machine.name == 'dpanel';
        }));

      case 5:
        dpanel = context$1$0.sent;
        started = false;

        if (!(dpanel && dpanel.state == 'Running')) {
          context$1$0.next = 9;
          break;
        }

        return context$1$0.abrupt('return', true);

      case 9:
        if (dpanel) {
          context$1$0.next = 17;
          break;
        }

        stdout.write('host not found, creating dpanel host \n');

        context$1$0.next = 13;
        return regeneratorRuntime.awrap(machine.command('create -d virtualbox dpanel'));

      case 13:
        create_response = context$1$0.sent;
        response = JSON.parse(create_response.raw).join();

        stdout.write(response);
        return context$1$0.abrupt('return', true);

      case 17:
        if (!(dpanel.state != 'Running')) {
          context$1$0.next = 22;
          break;
        }

        context$1$0.next = 20;
        return regeneratorRuntime.awrap(machine.command('start dpanel'));

      case 20:
        start_response = context$1$0.sent;

        console.log('start', start_response);

      case 22:
        if (!(dpanel.active != '*')) {
          context$1$0.next = 27;
          break;
        }

        context$1$0.next = 25;
        return regeneratorRuntime.awrap(machine.command('use dpanel'));

      case 25:
        active_response = context$1$0.sent;

        console.log('active', active_response);

      case 27:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function proxyReady() {
  console.log('starting proxy');
  return startContainer('proxy', 'jwilder/nginx-proxy', {
    Image: 'jwilder/nginx-proxy',
    name: 'proxy',
    'Volumes': {
      "/tmp/docker.sock": {}
    },
    "ExposedPorts": {
      "80/tcp": {}
    }
  }, {
    'Binds': ["/var/run/docker.sock:/tmp/docker.sock:rw"],
    'PortBindings': {
      "80/tcp": [{
        "HostPort": "80"
      }]
    }
  });
}

module.exports = {

  init: function init() {
    return hostReady().then(function () {
      console.log('ready');
      return proxyReady();
    }, function () {
      return false;
    });
  },

  start_api: function start_api() {
    // needs to be redone, start api changed
    return this.start('api', 'uptownhr/dpanel-api', {
      'Volumes': {
        '/var/run/docker.sock': {}
      }
    }, {
      'Binds': ["/var/run/docker.sock:/var/run/docker.sock", "/var/lib/dpanel:/var/lib/dpanel"]
    });
  },

  start: function start(domain, image, port, volume) {
    return pullImage(image).then(function () {
      var exposed_ports = {
        "80/tcp": {},
        "22/tcp": {},
        "3306/tcp": {}
      };

      var default_create_options = {
        Image: image,
        name: domain,
        'ExposedPorts': exposed_ports,
        'Tty': true,
        'Detach': false,
        'Env': ["VIRTUAL_HOST=" + domain],
        "AttachStdin": true,
        "AttachStdout": true,
        "AttachStderr": true,
        "OpenStdin": true
      };

      var default_start_options = {};

      if (port) {
        var port_key = port + '/tcp';
        default_create_options.ExposedPorts[port_key] = {};
        default_create_options.Env.push("VIRTUAL_PORT=" + port);
      }

      if (volume) {
        var volume_key = volume.split(':')[1];
        default_create_options.Volumes = {};
        default_create_options.Volumes[volume_key] = {};

        default_start_options.Binds = [volume];
      }

      console.log(default_create_options, default_start_options);
      return startContainer(domain, image, default_create_options, default_start_options);
    });
  },
  list: function list() {
    return q.promise(function (resolve, reject) {
      docker.listContainers(function (err, containers) {
        if (err) reject(err);
        resolve(containers);
      });
    });
  },
  stop: function stop(domain) {
    return q.promise(function (resolve, reject) {
      docker.containerExistsByName(domain).then(function (container) {
        docker.getContainer(container.Id).stop(function (err) {
          if (err) reject(err);
          resolve('container stopped');
        });
      }).fail(reject);
    });
  },
  'delete': function _delete(domain) {
    var self = this;
    return q.promise(function (resolve, reject) {
      docker.containerExistsByName(domain).then(function (container) {
        if (container.Status.indexOf('Exit') != -1) {
          docker.getContainer(container.Id).remove(function (err) {
            if (err) reject(err);
            resolve('domain deleted');
          });
        } else {
          self.stop(domain).then(function (res) {
            docker.getContainer(container.Id).remove(function (err) {
              if (err) reject(err);
              resolve('domain deleted');
            });
          });
        }
      }).fail(reject);
    });
  },
  docker: docker
};

//host not running, run host

//host not running, run host