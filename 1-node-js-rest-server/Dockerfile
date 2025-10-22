# ! Please make sure you are in root directory before running this file

FROM node:24.5.0

# set up image working directory. and this is best practice
# https://stackoverflow.com/questions/51066146/what-is-the-point-of-workdir-on-dockerfile
WORKDIR /app

# copy files from current directory to docker image
COPY ./1-node-js-rest-server/package.json package.json
COPY ./1-node-js-rest-server/package-lock.json package-lock.json

RUN npm install

COPY ./1-node-js-rest-server/server.js .

CMD ["node","server.js"]