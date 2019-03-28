//require('@google-cloud/debug-agent').start();

//***************** WARNING!! *********************
//Before deploy, confirm the 'now' variable in processShowtime in movietime.js is correct.
//Before push to git, confirm API KEY and MongoClient credentials are not pushed.

//When testing on localhost, the cloud storage part will require the environment variable,
//So be sure to run the following command before testing.
//export GOOGLE_APPLICATION_CREDENTIALS="/home/jay/movietime/gskey.json"

const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mt =  require('./movietime.js');
const gp = require('./getPoster.js');
const fs = require('fs');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = 'movie-1546758871417.appspot.com';

app.set('views', '.');
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 8080;

const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb://___@cluster00-shard-00-00-alnp6.mongodb.net:27017,cluster00-shard-00-01-alnp6.mongodb.net:27017,cluster00-shard-00-02-alnp6.mongodb.net:27017/test?ssl=true&replicaSet=Cluster00-shard-0&authSource=admin&retryWrites=true';
let db;

MongoClient.connect(uri, { useNewUrlParser: true } , function(err, client) {
  if(err)console.log("Failed to connect to MongoDB: ", err);
  assert.equal(null, err);
  console.log("Connected successfully to server");
  db = client.db('showtime');
  app.listen(PORT, () => {
  	console.log(`Server listening on port ${PORT}...`);
  });
});

app.get('/', async (req, res)=>{
	const [files] = await storage.bucket(bucketName).getFiles();
	res.render('index',{files:files});
});

app.get('/module', (req, res)=>{
	res.sendFile(path.join(__dirname+'/module.js'));
});

app.get('/getPoster',(req, res)=>{
	if(req.get('X-Appengine-Cron')){
		gp.getFilm();
		gp.deleteDoc(db);
		res.send('hello');
	}
})
app.get('/theaterinfo', (req,res)=>{
	//req.query : area  
	const areaID = req.query.area;
	let rawdata;
	try{
		rawdata = fs.readFileSync(`theaterinfo/${areaID}_info.json`);
	}catch(err){
		console.log(`Get raw data from theaterinfo/${areaID}_info.json failed.... :`, err);
	}
	//transform the raw data to object.
	let data = JSON.parse(rawdata);9
	res.send(data);
})

app.get('/nearestshowtime', async (req, res)=> {
	let querycontents = {};
	for(const key in req.query){
		querycontents[key] = req.query[key];
	}
	const result = await mt.getClosestMovieTime(querycontents['movie'],querycontents['area'], db);
	//console.log("in app.js", result);
	res.set('Access-Control-Allow-Origin','*');
	res.send(result);


});
