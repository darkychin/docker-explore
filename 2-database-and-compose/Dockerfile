# this file is use by `docker-compose`.
# Because we already navigate into this path `/2-database-and-compose` via compose,
# so the path in this `Dockerfile` don't need to repeat it anymore.

# ! Please make sure you are in root directory before running this file

FROM node:12.18.1

# set up image working directory. and this is best practice
# https://stackoverflow.com/questions/51066146/what-is-the-point-of-workdir-on-dockerfile
WORKDIR /app

# copy files from current directory to docker image
COPY ./package.json package.json
COPY ./package-lock.json package-lock.json

RUN npm install

COPY ./server.js .

CMD ["node","server.js"]