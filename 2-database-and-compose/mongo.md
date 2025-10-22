> **Important note**
>  
> Experienced obtained from debugging error:  
> `The promise rejected with the reason "Error: Error connecting to mongo. connect ECONNREFUSED 127.0.0.1:27017...`
> 
> There is actually no way to debug connection error from database side, due to no connection is established, and hence there is nothing to log.
> 
> The only way to have more connection info to debug is from client side, which we found the caused of the error in tutorial library. [Read more](./readme-debug.md) 

## 1. How to run a mongo shell from docker container?

if your mongo container is not running, try this
```sh
# mongo v4.2.8
docker exec -it -p 27017:27017 --name <mongo-container-name> mongo

# new mongo version after June 2020
docker run -it -p 27017:27017 --name <mongo-container-name> mongo:latest mongosh
```


When your mongo container is running, use command below to navigate into mongoshell.
```sh
# mongo v4.2.8
docker exec -it <mongo-container-name> mongo

# new mongo version after June 2020
# source: https://www.mongodb.com/company/blog/product-release-announcement/introducing-the-new-shell
docker exec -it <mongo-container-name> mongosh
```

[Source: How to run a mongo shell from docker container](https://stackoverflow.com/a/32944935/7939633)

## 2. How to check if your database exist/is created?

```sh
# in mongo shell
show dbs
```

Results should include your custom database name from connection string (which is `yoda_notes` from the tutorial)
```sh
# result
#
# admin        40.00 KiB
# config      108.00 KiB
# local        80.00 KiB
# yoda_notes   40.00 KiB  <- this one
```


## 3. Show and edit mongodb log verbosity
a. Run command below to shows logs verbosity:
```sh
# in mongo shell
db.getLogComponents()

# result
#
# ...
# {
#   "verbosity" : 0,
#   ...
#   "network" : {
#     "verbosity" : -1,
#   ...
# }
# ...
```
[Source: verbosity levels](https://www.mongodb.com/docs/manual/reference/log-messages/#verbosity-levels)

### 3.1 How to increase connectivity log verbosity?
```sh
# "2" is verbosity level, "network" is the module
db.setLogLevel(2, "network")

# verify result
db.getLogComponents()
```
[Source: set log verbosity level](https://www.mongodb.com/docs/manual/reference/log-messages/#db.setloglevel--)

## 4. Print all admin logs
Print all logs from mongoshell, which includes all startup, connections and other logs.  

This command print out the same logs as you run `docker logs <mongodb image name>`/
```sh
db.adminCommand({getLog: "global"})
```
[Source: print admin logs](https://www.mongodb.com/docs/manual/reference/command/getLog/#syntax)


## 5. Exit mongo shell
```sh
exit
```


