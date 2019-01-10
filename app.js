const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mt =  require('./movietime.js');
const fs = require('fs');
const https = require('https');
app.get('/', (req, res)=>{
	//console.log("connected");
	res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/module', (req, res)=>{
	res.sendFile(path.join(__dirname+'/module.js'));
});

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

app.get('/loadPoster', (req, res)=>{
	mt.loadPoster((result)=>{
		res.send(result);
	});
})

// https.createServer({
// 	key:fs.readFileSync('server.key'),
// 	cert:fs.readFileSync('server.cert')
// }, app)
// .listen(3000, ()=>{
// 	console.log("listening on port 3000.");
// });

app.listen(port, ()=>console.log("listening on port 3000"));