## Docker exploration with Node.js

Source - [Getting Started with Docker Using Node.js — Part 1](https://www.docker.com/blog/getting-started-with-docker-using-node-jspart-i/)

## Cheat Sheet Commands
| Command | Description |
|---|---|
|`docker build --tag <targetImageName>` | build an image and set the name of the image and an optional tag in the format ‘name:tag’|
| `docker images` | list all images |
| `docker tag <targetImage:version> <targetImage:NewVersion>` | add new tags to image |
| `docker rmi <targetImage:version>` | remove image |
| `docker run <targetImage>` | Run a built image |
| `docker run --publish 7000:8000 <targetImage>`| Run a build image that open port 7000 of host and map to image's port 8000 |
| `docker run --detach` | Run the image in background |
| `docker stop <containerName/containerId>` | Stop the running container |
| `docker ps` | list all running container processes |
| `docker ps -all` | list all running container on our system |
| `docker restart <containerName>`| to restart a container proccess|
| `docker rm <containerName>` | remove a container and its meta data |
| `docker run --name <newContainerName> <targetImage>` | remove a container and its meta data |

## Concluded command with shorthands
```
docker run -d -p 8000:8000 --name rest-server node-docker
```

## Extra
- What is [Ronin](https://www.npmjs.com/package/ronin-server) - just sample packages build by pmckee

##  Troubleshoot

### 1. `Dockerfile` cannot go up in directory, so you should run from root find the exact path for your Dockerfile

```
# running from root, use this command: 

docker build node-docker . -f ./1-node-js-rest-server/Dockerfile
```

- [What is "-f" in docker build](https://stackoverflow.com/questions/55259717/why-to-use-f-in-docker-build-command)
- [Command Source](https://stackoverflow.com/questions/56587758/how-to-navigate-up-one-folder-in-a-dockerfile)


### 2. `docker` command not found

If you are using wsl2 and you have installed your docker desktop on your host, please open docker desktop before you open your wsl2 in your terminal

### 3. docker image name conflict
If you faced error below:

```
docker: Error response from daemon: Conflict. The container name "/rest-server" is already in use by container "1b40d11c9981de8d485306a4dc9879e604bafc15c44ff23d1f91f2d83fb73dbc". You have to remove (or rename) that container to be able to reuse that name.
```

Consider remove container referenced via command `docker rm /<image-name>`.  
Reference:
- https://stackoverflow.com/questions/31697828/docker-name-is-already-in-use-by-container
- https://docs.docker.com/reference/cli/docker/container/rm/