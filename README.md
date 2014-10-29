#Dpanel
Dpanel makes hosting websites incredibly simple.
Think of it as cPanel, DirectAdmin, MAMP/WAMP style control panel, but using Docker technology. 
You can run multiple sites with unique domains that automatically maps to your containers.


##Get Started
1. docker pull uptownhr/dpanel
2. ```docker run -i -t --name dpanel -v /var/run/docker.sock:/var/run/docker.sock uptownhr/dpanel /bin/bash```

##How to use
1. If not already, remote into your Dpanel and run ```docker attach dpanel```
2. ```dpanel start myblog.com```
By default, dpanel creates a container with a wordpress image.
To specify another, just pass the -i flag (ie; dpanel start -i somerepo/someimage)
3. ```dpanel stop myblog.com```
Stops the container
4. ```dpanel delete myblog.com```
Deletes the container
5. ```dpanel list```
Lists all the running containers

##Dpanel cli help
    dpanel --help
  
    Usage: dpanel [options] [command]

    Commands:
    
    start [options] <domain>
       start a vhost.        
    
    stop <domain>
       stop a vhost

    delete <domain>
       delete vhost

    list
       start a vhost with image
