const { OAuthStrategy: MediaWikiStrategy } = require( 'passport-mediawiki-oauth' );
const passport = require( 'passport' );
const bodyParser = require( 'body-parser' );
const session = require( 'express-session' );

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