# Data Reuse Days 2025 Wikibase REST API Demo

This is a simple web application presented at the [Wikidata Data Reuse Days 2025](https://www.wikidata.org/wiki/Event:Data_Reuse_Days_2025) built using the Wikibase REST API. It was created for demo purposes only, and is not recommended to be used to edit Items on Wikidata.

## Setup

* create an OAuth 1.0a consumer on your target wiki
* `cp .env.example .env` and fill in the values accordingly
* export the variables from `.env`: `export $(cat .env | xargs)`
* configure the Item and Property IDs according to your target wiki: `cp ids.example.json ids.json` and fill in the values
* install npm dependencies: `npm install`
* run the development server: `npm run dev`

## Resources

* REST API docs: https://www.wikidata.org/wiki/Wikidata:REST_API
* REST API feedback: https://www.wikidata.org/wiki/Wikidata_talk:REST_API
* OAuth library used here including example code: https://github.com/milimetric/passport-mediawiki-oauth
