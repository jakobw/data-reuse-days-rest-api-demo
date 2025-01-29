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

async function makeApiRequest( path, method = 'GET', jsonBody ) {
	const restApiBaseUrl = 'http://default.mediawiki.mwdd.localhost:8080/w/rest.php/wikibase/v1';
	return ( await fetch(
		restApiBaseUrl + path,
		{
			method,
			headers: {
				'User-Agent': `DataReuseDaysDemo/0.0 (${ process.env.EMAIL })`,
				'Content-Type': 'application/json'
			},
			body: jsonBody && JSON.stringify( jsonBody )
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

async function addTypeStatement( itemId, value, typeQualifierValue ) {
	return makeApiRequest(
		`/entities/items/${ itemId }/statements`,
		'POST',
		{
			statement: {
				property: { id: ids.instanceOf },
				value: { type: 'value', content: value },
				qualifiers: [ {
					property: { id: ids.appliesToPart },
					value: { type: 'value', content: typeQualifierValue }
				} ]
			}
		}
	);
}

async function deleteTypeStatement( statementId ) {
	return makeApiRequest( `/statements/${ statementId }`, 'DELETE' );
}

async function changeTypeStatementValue( statementId, value ) {
	return makeApiRequest(
		`/statements/${ statementId }`,
		'PATCH',
		{
			patch: [
				{ op: 'replace', path: '/value/content', value: value }
			]
		}
	);
}

app.post( '/update-types', async ( req, res ) => {
	const updates = [
		{
			statementId: req.body.primaryStatementId,
			newType: req.body.primaryType,
			originalType: req.body.originalPrimaryType,
			typeQualifierValue: ids.primaryType
		},
		{
			statementId: req.body.secondaryStatementId,
			newType: req.body.secondaryType,
			originalType: req.body.originalSecondaryType,
			typeQualifierValue: ids.secondaryType
		},
	];

	for ( const { statementId, newType, originalType, typeQualifierValue } of updates ) {
		if( !statementId && newType !== 'none' ) {
			await addTypeStatement( req.body.id, newType, typeQualifierValue );
		} else if( statementId && newType === 'none' ) {
			await deleteTypeStatement( statementId );
		} else if( statementId && newType !== originalType ) {
			await changeTypeStatementValue( statementId, newType );
		}
	}

	res.redirect( `/pokemon?id=${req.body.id}` );
} );

app.listen( port, () => {
	console.log( `App listening on port ${port}` )
} );
