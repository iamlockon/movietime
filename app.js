const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mt =  require('./movietime.js');
const fs = require('fs');

app.set('views', '.');
app.set('view engine', 'ejs');
app.use('/static', express.static('images'));

app.get('/', (req, res)=>{
	let files = fs.readdirSync('images');
	res.render('index',{files:files});
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

app.listen(port, ()=>console.log("listening on port 3000"));