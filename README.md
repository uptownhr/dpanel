#dpanel
The easiest way to convert your VM into a VirtualHost webserver.

##Get Started
1. npm install -g dpanel
2. dpanel start myblog.com

Checkout the [docker dpanel image] (#dpanel-docker) if you don't want to install node and npm.

##dpanel cli help
    dpanel --help
  
    Usage: dpanel [options] [command]

    Commands:
    
    init-api 
       initialize dpanel restful API *Optional if you want restful API access
    
    start [options] <domain>
       start a vhost with image
    

    Options:

    -h, --help     output usage information
    -V, --version  output the version number

    dpanel start --help
  
    Usage: start [options] <domain>

    Options:

    -h, --help           output usage information
    -i, --image [image]  Specify [image] to create container with

##Under the hood
Dpanel is made up a few components

1. dpanel CLI, pull images and starts containers
2. jwilder/nginx-proxy docker image, listens for new "domain.com" containers and automatically creates the nginx virtual host file for container forwarding
3. dpanel restful API, access to dpanel actions through HTTP
4. dpanel docker image. Optional docker image if you don't want to install nodejs/npm.

##dpanel API.js
With api.js, get access the CLI commands through HTTP

1. dpanel init-api
2. go to http://domain:3100/user/login #need to improve *currently not activated
3. start: http://domain:3100/start/testing.com
4. list: http://domain:3100/list
5. stop: http://domain:3100/stop/testing.com

###routes
####Start a domain, defaults to using a wordpress image
`/start/:domain

####Start a domain and specify image to use
`/start/:domain/:user_repo/:image?

####List domains
`/list

####Stop a domain
`/stop/:domain

####Delete a domain. *If you want to recreate a domain with another image 
`/delete/:domain

##dpanel Docker
If nodejs is not available on the host. Pull the dpanel docker image

1. docker pull uptownhr/dpanel 
2. docker run -i -t -v /var/run/docker.sock:/var/run/docker.sock uptownhr/dpanel /bin/bash
3. dpanel start myblog.com

The server now has a wordpress blog listening on myblog.com. 


##Todo
1. Create a list of dpanel ready images. *Most web host related docker images should already be dpanel ready.
2. Create a dpanel docker image. For systems that do not support nodejs.
