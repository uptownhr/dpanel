#dpanel
The easiest way to convert your VM into a VirtualHost webserver.

##Get Started
1. npm install -g dpanel
2. dpanel init
3. dpanel start -i wordpress myblog.com


##coreos
If nodejs is not available on the host. Install dpanel inside a docker container.

1. docker run -i -t -v /var/run/docker.sock:/var/run/docker.sock ubuntu /bin/bash
2. apt-get update
3. apt-get install node.js
4. apt-get install npm
5. ln -s /usr/bin/nodejs /usr/bin/node
6. npm install -g dpanel
7. dpanel init
8. dpanel start -i wordpress myblog.com

The server now has a wordpress blog listening on myblog.com. 

##dpanel cli help
    dpanel --help
  
    Usage: dpanel [options] [command]

    Commands:

    init 
       initialize dpanel images
    
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

##dpanel API.js
With api.js, get access the CLI commands through HTTP

1. node api.js (recommended to run with forever so it is long living)
2. go to http://domain:3100/user/login #need to improve
3. start: http://domain:3100/start/testing.com
4. list: http://domain:3100/list
5. stop: http://domain:3100/stop/testing.com

###routes

####Start a domain
`/start/:domain/:image?

####List domains
`/list

####Stop a domain
`/stop/:domain



##Todo
1. Create a list of dpanel ready images. *Most web host related docker images should already be dpanel ready.
2. Create a dpanel docker image. For systems that do not support nodejs.
