FROM ubuntu:14.04

RUN apt-get update

RUN apt-get install -y git
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN npm install -g forever

RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN git clone https://github.com/uptownhr/dpanel.git
WORKDIR /dpanel
RUN npm install

RUN echo "forever start /dpanel/api.js" >> /etc/bash.bashrc


EXPOSE 9999