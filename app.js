const path = require( 'path' );
const express = require( 'express' );
const { setUpOauth } = require( './auth' );
const ids = require( './ids.json' );

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

async function getStatements( id, pId ) {
	return ( await makeApiRequest( `/entities/items/${ id }/statements?property=${ pId }` ) )[ pId ] || [];
}

function findStatementWithQualifier( statements, qualifierProperty, qualifierValue ) {
	return statements.find( ( statement ) => {
		return statement.qualifiers.some( ( qualifier ) => qualifier.property.id === qualifierProperty
			&& qualifier.value.content === qualifierValue );
	} );
}

app.get( '/pokemon', async ( req, res ) => {
	const id = req.query.id;

	const instanceOfStatements = await getStatements( id, ids.instanceOf );
	const primaryTypeStatement = findStatementWithQualifier( instanceOfStatements, ids.appliesToPart, ids.primaryType );
	const secondaryTypeStatement = findStatementWithQualifier( instanceOfStatements, ids.appliesToPart, ids.secondaryType );

	res.render( 'pokemon', {
		id,
		label: await getLabel( id ),
		user: req.session.user,
		primaryTypeStatement,
		secondaryTypeStatement,
		allTypes: ids.allTypes
	} );
} );

app.listen( port, () => {
	console.log( `App listening on port ${port}` )
} );
