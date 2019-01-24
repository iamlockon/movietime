require('@google-cloud/debug-agent').start();
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mt =  require('./movietime.js');
const gp = require('./getPoster.js');
const fs = require('fs');
const {exec} = require('child_process');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = 'movie-1546758871417.appspot.com';

app.set('views', '.');
app.set('view engine', 'ejs');

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
	let data = JSON.parse(rawdata);
	res.send(data);
})

app.get('/nearestshowtime', (req, res)=> {
	let querycontents = {};
	for(const key in req.query){
		querycontents[key] = req.query[key];
	}
	mt.getClosestMovieTime(querycontents['movie'],querycontents['area'],(result)=>{
		res.set('Access-Control-Allow-Origin','*');
		res.send(result);
	});

});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});