#dpanel
The easiest way to convert your VM into a VirtualHost webserver.

##Get Started
1. npm install -g dpanel
2. dpanel init
3. dpanel start -i wordpress myblog.com


##coreos
If nodejs is not available on the host. Install Dpanel inside a docker container.

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

##Todo

1. Create a list of dpanel ready images. *Most web host related docker images should already be Dpanel ready.
2. Create a dpanel docker image. For systems that do not support nodejs.
