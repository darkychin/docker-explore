# Part 2 - Docker network, mongodb database and docker compose

Source - [Getting Started with Docker Using Node.js — Part 2](https://www.docker.com/blog/getting-started-with-docker-using-node-part-ii/)

# Section 1: Local Database and Containers

## Step 1

Reserve docker container [volume](https://docs.docker.com/engine/storage/volumes/) for your mongodb and its configurations

```sh
docker volume create mongodb

docker volume create mongodb_config
```

## Step 2

Create a docker network and name it as `mongodb`.  
This network will be the communication channel between our application (server.js) and database (mongodb).

```sh
docker network create mongodb
```

Side note:  
use `docker network ls` to list all networks

## Step 3

Run a mongodb image from DockerHub utilizing our previous locally reserved volume

[Reference](https://hub.docker.com/_/mongo/#start-a-mongo-server-instance)

```sh
# `-v <local>:<target>` mapping local mongodb volume resource to image's `/data/db`
docker run -it --rm -d -v mongodb:/data/db \   

# `-v <local>:<target>` mapping local mongodb_config volume resource to image's `/data/configdb`
# `-p 27017:27017` open host port and mapping to image port
-v mongodb_config:/data/configdb -p 27017:27017 \

# the docker network to use
--network mongodb \

# the current image name
--name mongodb \

# run a container using official mongodb image, here https://hub.docker.com/_/mongo/
# mongo
# run this version due to latest mongo change their MongoClient.connect() API - https://mongodb.github.io/node-mongodb-native/6.20/classes/MongoClient.html#connect
mongo:4.2.8 


# runnable command
docker run -it --rm -d -v mongodb:/data/db \
-v mongodb_config:/data/configdb -p 27017:27017 \
--network mongodb \
--name mongodb \
mongo:4.2.8

# tip: remove `-rm` if you wish to keep it for debugging
```

### Command Param Refresher - `docker run`

Run `docker run --help` to get the official explanation for each flag for a container

| Command | Description | Reference |
|---|---|---|
| -it | an interactive flag, allowing user to tie the host's terminal input and output with the container | [What is docker run -it flag?](https://stackoverflow.com/a/77355180/7939633) |
| -rm | delete and clean up the container after run, commonly use for quick POC | [What does '--rm' flag doing?](https://stackoverflow.com/questions/49726272/what-is-the-rm-flag-doing) |
| -d | run container in detached mode (not hogging the current terminal) ||
| -v | bind mount a volume to the container | `docker run --help` |
| -p | publish a container's port(s) to the host | `docker run --help` |

## Step 4

Update the `server.js` from tutorial 1.

```js
const ronin     = require( 'ronin-server' )
const mocks     = require( 'ronin-mocks' )
const database  = require( 'ronin-database' )
const server = ronin.server()

database.connect( process.env.CONNECTIONSTRING )

/**
 * We will set in-memory flag to false (third flag)
 * so that we can save into mongodb
 * 
 * ? not reading the document carefully cost me 4 hours debugging
 */
server.use( '/', mocks.server( server.Router(), false, false ) )

server.start()
```

## Step 5

Add the `ronin-database` module to our application using npm.

```sh
# current directory: /2-database-and-compose 
npm install ronin-database
```

## Step 6
Update your `Dockerfile` resource path.

This time we will create a duplicated file of previous `Dockerfile` and name it as `Dockerfile-before-compose` for clarity purpose.

Due to our different file structure design from the tutorial, we need to update the file path to map to the correct resources.

> **Note**  
> Forgetting to update this part causes me to waste 1 day on debugging on why the database data persistence problem...

```sh
# current file: /2-database-and-compose/Dockerfile-before-compose

# ! Please make sure you are in root directory before running this file

FROM node:12.18.1

# set up image working directory. and this is best practice
# https://stackoverflow.com/questions/51066146/what-is-the-point-of-workdir-on-dockerfile
WORKDIR /app

# copy files from current directory to docker image
COPY ./2-database-and-compose/package.json package.json
COPY ./2-database-and-compose/package-lock.json package-lock.json

RUN npm install

COPY ./2-database-and-compose/server.js .

CMD ["node","server.js"]
```

## Step 7
Build a new image from the current settings.

From here we will deviate from the tutorial.

We will archive our old version as `0.0.1` , then build this version as the "latest".

```sh
# Tag previous version as archive
docker tag node-docker:latest node-docker:0.0.1
```

Go to root directory and run build command below.

```sh
# current directory: /docker-explore

docker build --tag node-docker . -f ./2-database-and-compose/Dockerfile-before-compose

# tip: not adding version behind `node-docker` to tag it as "latest"
```

### Command Param Refresher 
| Command | Description | Reference |
|---|---|---|
|`docker tag <currentImageName:currentTag> <current/newImageName:newTag>`  (`docker image tag`) | create a tag TARGET_IMAGE that refers to SOURCE_IMAGE | [official link](https://docs.docker.com/reference/cli/docker/image/tag/) or `docker tag --help` |
|`docker rmi <imageName>` | remove a docker image (including its metadata, eg: tag) | `docker rmi --help`|

### Extra reading on docker tag practices

- [docker best practice with env](https://stackoverflow.com/questions/44509375/docker-what-are-the-best-practices-when-tagging-images-for-an-environment)

Personally, I prefer "latest" as the experimental version, while tagged version be the stable one.

## Step 8

Run the container with environment variable `CONNECTIONSTRING` (used in the updated `server.js` file).

Note:  
`"yoda_notes"` is actually the database name we will connect to, [read more here](https://www.mongodb.com/docs/manual/reference/connection-string-examples/#self-hosted-records-database-running-locally).

```sh
# runable command
docker run \
-it --rm -d \
--network mongodb \
--name rest-server \
-p 8000:8000 \
-e CONNECTIONSTRING=mongodb://mongodb:27017/yoda_notes \
node-docker

# tip: remove `-rm` if you wish to keep it for debugging
```
 
If you hit error:

```sh
docker: Error response from daemon: Conflict. The container name "/rest-server" is already in use by container "66c7968d5f6305df3f16f96669b11dcd5d6b820c33139147ef0c97963276901c". You have to remove (or rename) that container to be able to reuse that name.
```

Try removing the container with `docker rm <containerName>` and try again.

## Step 9 - Testing

Run curl command below to see if it works.

Testing on `POST`

```sh
curl --request POST \
  --url http://localhost:8000/notes \
  --header 'content-type: application/json' \
  --data '{
"name": "this is a note",
"text": "this is a note that I wanted to take while I was working on writing a blog post.",
"owner": "peter"
}'
```

Expected result
```sh
{"code":"success","payload":{"_id":"5efd0a1552cd422b59d4f994","name":"this is a note","text":"this is a note that I wanted to take while I was working on writing a blog post.","owner":"peter","createDate":"2020-07-01T22:11:33.256Z"}}
```

Testing on `GET`

```sh
curl --request GET --url http://localhost:8000/notes
```

Expected result
```sh
{"code":"success","meta":{"total":1,"count":1},"payload":[{"_id":"68d3a1e37d79c441b64ffcb9","name":"this is a note","text":"this is a note that I wanted to take while I was working on writing a blog post.","owner":"peter","createDate":"2025-09-24T07:46:43.044Z"}]}%
```

You can read a running/stopped container log with:
```sh
docker logs <containerName>
```

### [Section 1 - Troubleshooting](./readme-debug.md#section-1-local-database-and-containers)

Go [here](./readme-debug.md#section-1-local-database-and-containers) for troubleshooting.

---
---

# Section 2 - Using Compose to Develop locally

To efficiently run a container without always retyping the entire command and configuration in the cli, we will use `docker compose`.

## Step 1 

Create a yml docker compose file name `docker-compose.dev.yml` with content below:

```yml
# official doc for docker compose: https://docs.docker.com/reference/compose-file/

# - about `version: 3.8` : https://stackoverflow.com/a/76157215/7939633
# - `version` is deprecated (2025 September) and used for backward compatibility: https://docs.docker.com/reference/compose-file/version-and-name/#version-top-level-element-obsolete 
version: '3.8'

services:
  # service name
  notes:
    build:
      # context defines either a path to a directory containing a Dockerfile, or a URL to a Git repository: https://docs.docker.com/reference/compose-file/build/#context
      context: .
    ports:
      - 8000:8000
      # this port is for chrome debugger
      - 9229:9229
    environment:
      # the `mongo` here is referring to `service: mongo` on the next section
      - CONNECTIONSTRING=mongodb://mongo:27017/yoda_notes
    # internal docker volume use by this service only: https://docs.docker.com/reference/compose-file/services/#volumes
    volumes:
      - ./:/code
    # use to override `CMD` in `Dockerfile`
    # read more on command:
    # - https://docs.docker.com/reference/compose-file/services/#command
    # - https://www.docker.com/blog/docker-best-practices-choosing-between-run-cmd-and-entrypoint/
    command: npm run debug
    # added from tutorial because the app might run before db is ready
    # https://docs.docker.com/reference/compose-file/services/#depends_on
    depends_on:
      - mongo

  mongo:
    image: mongo:4.2.8
    ports:
      - 27017:27017
    volumes:
      - mongodb:/data/db
      - mongodb_config:/data/configdb

# sharable volume between services: https://docs.docker.com/reference/compose-file/volumes/
volumes:
  mongodb:
  mongodb_config:
```

> **Important Note**  
> An extra space in front of top level `volumes` in the tutorial is an error.  
> read the correct example [here](https://docs.docker.com/reference/compose-file/volumes/#example)

Changes:  
- the `command` in `services - notes` is used to run chrome debug mode in "Section 2.1".
- new line `depends_on` in `services - notes` is added to ensure `mongodb` is up before our `notes`

## Step 2
Update `package.json` with following:
```json
// package.json

// ...
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    // add line below
    "debug": "nodemon --inspect=0.0.0.0:9229 server.js"
  },
// ...
```

## Step 3
Install `nodemon` in your app for debug usage in "Section 2.1".

```sh
# current directory: /2-database-and-compose

npm install nodemon
```

## Step 4
Stop all of your container and run docker compose with command below
```sh
# current directory: /docker-explore

# stop all container
docker stop rest-server mongodb
```

```sh
# current directory: /docker-explore

# run docker compose
# `-d` is added to run the compose at the background for easy testing
docker-compose -f 2-database-and-compose/docker-compose.dev.yml up --build -d
```

## Step 5 - Testing
Testing on `GET`
```sh
$ curl --request GET --url http://localhost:8000/notes
```

Expected result
```sh
{"code":"success","meta":{"total":0,"count":0},"payload":[]}%
```

## Section 2.1 - Chrome Debug

### Step 1: 
Open chrome in address `about:inspect`

### Step 2:
Click on the link "Open dedicated DevTools for Node" to open a node console.

### Step 3:
Update `server.js` file at line 9
```js
// /server.js file

// add at line 9
server.use( '/foo', (req, res) => {
  return res.json({ "foo": "bar" })
})
```

### Step 4:
Set a breakpoint in node console `server.js` file at line 10

### Step 5
Test with following command to see the breakpoint working:
```sh
curl --request GET --url http://localhost:8000/foo
``` 


## [Section 2 - Troubleshooting](./debug.md#section-2---using-compose-to-develop-locally)

Go [here](./readme-debug.md#section-2---using-compose-to-develop-locally) for troubleshooting.