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

async function makeApiRequest( path ) {
	const restApiBaseUrl = 'http://default.mediawiki.mwdd.localhost:8080/w/rest.php/wikibase/v1';
	return ( await fetch(
		restApiBaseUrl + path,
		{
			headers: {
				'User-Agent': `DataReuseDaysDemo/0.0 (${ process.env.EMAIL })`
			}
		}
	) ).json();
}

async function getLabel( id ) {
	return makeApiRequest( `/entities/items/${ id }/labels/en` );
}

app.get( '/pokemon', async ( req, res ) => {
	const id = req.query.id;

	res.render( 'pokemon', { id, label: await getLabel( id ), user: req.session.user } );
} );

app.listen( port, () => {
	console.log( `App listening on port ${port}` )
} );
