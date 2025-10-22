# Part 2 - Docker network, mongodb database and docker compose

Source - [Getting Started with Docker Using Node.js — Part 2](https://www.docker.com/blog/getting-started-with-docker-using-node-part-ii/)

# Section 1: Local Database and Containers

## QnA and Troubleshooting

### Q1: Why restarting/shutdown mongodb container will not persist the data?
Answer: 
1. Please check if you have updates your `server.js` correctly with new flag.
2. Please check if you have updated your `Dockerfile` correctly with new path.
3. Use command in [mongodb-readme](./mongo-readme.md) to check if the database is created.

### Q2: Why do my `/rest-server` container keep closing itself with error below?
Answer: 
```sh
# ...
 The promise rejected with the reason "Error: Error connecting to mongo. connect ECONNREFUSED 127.0.0.1:27017..."
# ...
```

If you are using Node version  > 15, that error throw by Mongo, is subsequently throw upward by ronin-database (database use by author), and the unhandled error will bubble up and crash the application.
- [unhandled promise rejections cause the process to exit with a non-zero exit code](https://blog.pixelfreestudio.com/unhandled-promise-rejections-how-to-catch-and-fix-them/)

### Q3: `ECONNREFUSED` error, why it happenned?
Answer:  

`ECONNREFUSED` error means that mongdb refused our connection. 

But if you use the correct connection string and and able to send `POST` and `GET` requests as expected, it is likely due to the following issue. 

It happenned due to the fact that author has used an incorrect connection string to connect to the mongodb.

```js 
// current file: /node_modules/ronin-database/lib/index.js

async function getConnection( name = 'default' ) {
	let connection = connections[ name ]
	
  if( !connection ) {
    connection = await connect( 'mongodb://localhost:27017/ronin' ) // here using wrong connection
	}

	return connection
}
```

It will be ran when when we called `server.start()` in our `server.js`
```js
//  current file: /server.js

// ...
server.start()
```

The correct url connection should be the one we passed into the `env:CONNECTIONSTRING`.

The other processes used the correct connection string, hence why the subsequent `POST` and `GET` requests are successful even when the `ECONNREFUSED ` error is thrown.

## Proofs
To proved that, we will be adding logs into client side code, because mongodb is not able to provide more info ([read more](./mongo.md)).

### Step 1: Update code in the `/node_modules/ronin-database/index.js`
We will add loggers to print the current connection string used in the function `connect()`.

```js
// current file: /node_modules/ronin-database/lib/index.js

// ...

async function connect( url, name = 'default' ) {
	if( !url ) {
		throw new Error( 'Connection String Required. Please provide a mongodb connection string. See https://docs.mongodb.com/manual/reference/connection-string/ for more details.' ).stack
	}
	
	if ( connections[name] ) resolve( connections[name] )

	try {
		console.log(`db connection to url ${url}`) // added logger

		const db = await mongo.connect( url, { useNewUrlParser: true, useUnifiedTopology: true } )

		console.log(`db connection to url ${url} [success]`) // added logger
	
		connections[name] = db.db()

		return db
	} catch( err ) {
		console.error(`db connection to url ${url} [failed]`) // added logger
		throw new Error( `Error connecting to mongo. ${err.message}` ).stack
	}
	
}

// ...
```

Then we add `try...catch...finally` and some loggers to the `getConnection` function
```js
// current file: /node_modules/ronin-database/lib/index.js

// ...

async function getConnection( name = 'default' ) {
	let connection = connections[ name ]
	if( !connection ) {
		try { // added try catch
			console.log("getConnection: start connection")  // added logger

			connection = await connect( 'mongodb://localhost:27017/ronin' )
		} catch (error) { // added try catch
			console.log(error)  // added logger
			console.trace(error)  // added logger
		} finally { // added finally to indicite the connection is completed
			console.log("getConnection: finished connection")
		}
	}

	return connection
}

// ...
```

---

### Step 2: Use the updated `/node_modules/ronin-database/lib/index.js` in your image

Since `npm link` using relative address, and `npm install` will always pull the library from npm registry; we will alter the `Dockerfile` to use the our updated file instead.

```Dockerfile
# ...

# copy local node modules into the image
COPY ./2-database-and-compose/node_modules node_modules

# remove command `npm install`
# RUN npm install

# ...


# check out /Dockerfile-debug-errcon for example
```
[Reference](https://github.com/npm/npm/issues/14325#issuecomment-285566020)

---

### Step 3: Build a new image with this `Dockerfile`
We will tag this debug version as `node-docker:0.0.2` and find our target docker file (sample named `Dockerfile-debug-errcon`)
```sh
# current directory: /docker-explore
docker build --tag node-docker:0.0.2 . -f ./2-database-and-compose/Dockerfile-debug-errcon
```

---

### Step 4: Create a new container from this image and observes it
Run the command and build a container named `rest-server-debug`
```sh
# current directory: /docker-explore
docker run \
-it -d \
--network mongodb \
--name rest-server-debug \
-p 8000:8000 \
-e CONNECTIONSTRING=mongodb://mongodb:27017/yoda_notes \
node-docker:0.0.2
```

Observe it:
1. via `docker desktop -> Containers -> rest-server-debug` OR
2. log the container after 5 minutes running, with command `docker logs rest-server-debug`

Result
```sh
db connection to url mongodb://mongodb:27017/yoda_notes
getConnection: start connection
db connection to url mongodb://localhost:27017/ronin
db connection to url mongodb://mongodb:27017/yoda_notes [success]
db connection to url mongodb://localhost:27017/ronin [failed]
Error: Error connecting to mongo. connect ECONNREFUSED 127.0.0.1:27017
    at connect (/app/node_modules/ronin-database/lib/index.js:25:9)
Trace: Error: Error connecting to mongo. connect ECONNREFUSED 127.0.0.1:27017
    at connect (/app/node_modules/ronin-database/lib/index.js:25:9)
    at Object.getConnection (/app/node_modules/ronin-database/lib/index.js:38:12)
getConnection: finished connection
```

---

### Step 5 Analyze
It is shown that connection string `mongodb://mongodb:27017/yoda_notes` is successful.  
And connection string `mongodb://localhost:27017/ronin` used from `getConenction`is failed and an error `ECONNREFUSED 127.0.0.1:27017` is thrown.

---

### Conclusion
Since this error does not impact our `GET` and `POST` request, we can just safely ignored it for now.

Or if you insist to solve it, remove the line below in `/node_modules/ronin-database/lib/index.js`

```js
// current file: /node_modules/ronin-database/lib/index.js

// ...

async function getConnection( name = 'default' ) {
	let connection = connections[ name ]
	if( !connection ) {
    // connection = await connect( 'mongodb://localhost:27017/ronin' ) // remove this line
	}

	return connection
}

// ...
```

### Solution Reference  
- [docker forum](https://forums.docker.com/t/getting-started-with-docker-using-node-part-ii-connection-refused/144650)

---
---

# Section 2 - Using Compose to Develop locally

## QnA and Troubleshooting

### Q1. What to do when you face error below during docker run/compose?

```sh
# ...
 The promise rejected with the reason "Error: Error connecting to mongo. connect ECONNREFUSED 127.0.0.1:27017
# ...
```

Answer:  

#### Step 1

Please make sure that you are using the following image version in your `docker/docker-compose` file correctly:
  - node: *12.18.1*
  - mongo: *4.2.8*

> **Why must we use these versions**?  
> As a smarty pants, I tried using latest version of node(v24) and mongo(v8),  
> and due [Node v15 breaking change](#q2-why-do-my-rest-server-container-keep-closing-itself-with-error-below), I have wasted a lot of time beating around the bushes without identifying the root caused.

#### Step 2  

The error `ECONNREFUSED 127.0.0.1:27017` is ignorable because it should not stop you from firing your requests.  

You can read the reason here - [Why ECONNREFUSED error happenned](#q3-econnrefused-error-why-it-happenned)

### Q2. How to clean up and start from scratch?
Answer:  

### Step 1 
Remove all previously created volume and networks
```sh
# for docker run
docker rm mongodb mongodb_config
docker network rm mongodb


# add `-v` in the end if you wish to delete the volume as well
# current directory: /docker-explore
docker-compose -f 2-database-and-compose/docker-compose.dev.yml down
```

---

### Step 2
(`docker run` only) Rebuild your images

---

### Step 3 
Restart the tutorial from step 1 again

---

### Q2. How to clean up my composed files when I wish to restart?
Answer:  

Run `docker-compose down` with the compose yml file.

Adding `-v` flag remove the volume created by this compose.
```sh
# current directory: /docker-explore
docker-compose -f 2-database-and-compose/docker-compose.dev.yml down -v
```