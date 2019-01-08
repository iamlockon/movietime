const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mt =  require('./movietime.js');
const fs = require('fs');
app.get('/', (req, res)=>{
	res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/movietime/module.js', (req, res)=>{
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

app.listen(port , ()=> console.log(`App listening on port ${port} `));
