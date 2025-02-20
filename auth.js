const { OAuthStrategy: MediaWikiStrategy } = require( 'passport-mediawiki-oauth' );
const passport = require( 'passport' );
const bodyParser = require( 'body-parser' );
const session = require( 'express-session' );
const OAuth = require( 'oauth-1.0a' );
const crypto = require( 'crypto' );

const oauth = OAuth( {
	consumer: { key: process.env.MEDIAWIKI_CONSUMER_KEY, secret: process.env.MEDIAWIKI_CONSUMER_SECRET },
	signature_method: 'HMAC-SHA1',
	hash_function( base_string, key ) {
		return crypto
			.createHmac( 'sha1', key )
			.update( base_string )
			.digest( 'base64' )
	},
} );

function getAuthorizationHeader( user, method, url ) {
	return oauth.toHeader( oauth.authorize(
		{ url, method, data: {} },
		{
			key: user.token,
			secret: user.token_secret
		}
	) ).Authorization;
}

module.exports.getAuthorizationHeader = getAuthorizationHeader;

function setUpOauth( app, port ) {
	passport.use( new MediaWikiStrategy(
		{
			consumerKey: process.env.MEDIAWIKI_CONSUMER_KEY,
			consumerSecret: process.env.MEDIAWIKI_CONSUMER_SECRET,
			callbackURL: `http://localhost:${ port }/auth/mediawiki/callback`,
			baseURL: 'http://default.mediawiki.mwdd.localhost:8080/'
		},
		function ( token, tokenSecret, profile, done ) {
			profile.oauth = {
				consumer_key: process.env.MEDIAWIKI_CONSUMER_KEY,
				consumer_secret: process.env.MEDIAWIKI_CONSUMER_SECRET,
				token: token,
				token_secret: tokenSecret
			};
			return done( null, profile );
		}
	) );

	passport.serializeUser( ( user, done ) => done( null, user ) );
	passport.deserializeUser( ( obj, done ) => done( null, obj ) );

	app.use( passport.initialize() );
	app.use( passport.session() );
	app.use( bodyParser.urlencoded( { extended: true } ) );
	app.use( session( {
		secret: 'very secret',
		cookie: {},
		resave: false,
		saveUninitialized: true
	} ) );

	app.get( '/login/mediawiki', passport.authenticate( 'mediawiki' ) );

	app.get( '/auth/mediawiki/callback', function ( req, res, next ) {
		passport.authenticate( 'mediawiki', function ( err, user ) {
			req.logIn( user, function () {
				req.session.user = user;
				res.redirect( '/' );
			} );
		} )( req, res, next );
	} );
}

module.exports.setUpOauth = setUpOauth;