const path = require( 'path' );
const express = require( 'express' );
const { setUpOauth } = require( './auth' );

const app = express();
const port = 7777;

app.set( 'view engine', 'ejs' );
app.set( 'views', path.join( __dirname, 'views' ) );

setUpOauth( app, port );

app.get( '/', ( req, res ) => {
	res.render( 'index', { user: req.session.user } );
} );

app.listen( port, () => {
	console.log( `App listening on port ${port}` )
} );
