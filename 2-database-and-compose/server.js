const ronin = require( 'ronin-server' )
const mocks = require( 'ronin-mocks' )
const database = require( 'ronin-database' )

const server = ronin.server()

database.connect( process.env.CONNECTIONSTRING )

 server.use( '/foo', (req, res) => {

   return res.json({ "foo": "bar" })

 })
 
/**
 * We will set in-memory flag to false (third flag)
 * so that we can save into mongodb
 * 
 * ? not reading the document carefully cost me 4 hours debugging
 */
server.use("/", mocks.server(server.Router(), false, false))
server.start()