/*
Inspired by https://ithelp.ithome.com.tw/articles/10192478
*/

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb+srv://iamlockon:ntjh42005@cluster00-alnp6.mongodb.net/test?retryWrites=true';
const client = new MongoClient(uri, {useNewUrlParser: true});

// getClosestMovieTime(process.argv[2], process.argv[3],(result)=>{
// 	console.log(result);
// });


module.exports = {


	getClosestMovieTime : async function getClosestMovieTime(movie, area, callback){
		/**
		*	movie:filmID
		*	area: "XX" in zh-TW
		*/
		let areaID;
		areaID = getAreaID(area);
		//let now = new Date(2019,1,1,10,10);
				
		//See if db has data.
		client.connect(async (err) =>{
			if(err){
				console.log("Error connecting db...:",err);
			}
			/*
		    *in db 'showtime', there is one collection of movies,
			*in which there are areas documents, in which there are showtime data for all theaters in that area.
			*showtime-[movies]-[areas]
			*movies collection looks like:
			*{
			*	{name: filmIDA, showtime: {areas}},
				{name: filmIDB, showtime: {areas}}
			*}
			*areas documents look kind of like:
			*{
				{ "a01":[{theater:"A theater", type:[""],times:["10:00","13:00","15:00"]},
						{theater:"B theater", type:["",""],times:[["10:00","13:00","15:00"],["14:30"]}
						],
				{ "a02":[]},
			 }
			*/
			let collection = client.db("showtime").collection("movies");
			//if db does not have data, request and cache into db first.
			let res = collection.findOne({name: movie});
			if(!res || !res.showtime){
				let result = await getShowtime(movie, areaID);
				let val;
				if(result === 'E'){
					val = [];
				}else{
					//TODO:get all showtime of the day for the movie/areaID
					
				}
				try{
					collection.updateOne(
						{ "name" : movie },
						{ $set: { showtime.areaID : val}},
						{
							upsert: true
						}
					);
				}catch (e) {
					console.log(e);
				}
			}
			//get all data of the area for the movie from db.
			let data = res.showtime.areaID;
			//TODO:filter and return



			client.close();
		});
		//console.log(now);
		
	}
};

function getShowtime(movie,areaID) {
	return new Promise((resolve)=>{
			request('http://www.atmovies.com.tw/showtime/'+movie+'/'+areaID+'/', (err, res, body) => {
			if(err)
				console.log(err);
			let $ = cheerio.load(body);
			
			if($('#filmShowtimeBlock ul').length === 0){
				//console.log("empty");
				resolve('E');
			}else{
				const sel = $('#filmShowtimeBlock ul');
				resolve(sel);
			}
		});
	});
}



function processShowtime(sel) {
	//For Localtest
	let now = new Date();
	//For GCP
	now.setHours(now.getHours() + 8);
	let repeated = [];
	let result = sel.map((index,obj)=>{
		let cur = sel[index];
		let next = sel[index+1];
		//console.log("A:",$(cur).find('.theaterTitle a').text()," B:",$(next).find('.theaterTitle a').text());
		if($(cur).find('.theaterTitle a').text() == $(next).find('.theaterTitle a').text()){
			repeated.push(index+1);
		}
		return {
			theater:$(obj).find('.theaterTitle a').text(),
			type:[$(obj).find('.filmVersion').text()],
			times:[$(obj).find('li').filter((i, ele)=>{
				if($(ele).text().includes('：')){

					let hhmm = $(ele).text().split('：');
					//console.log(hhmm[0]);

					// Beware of arithmetic expressions. hhmm[1]*1 but not hhmm[1] only.
					// Limit the time range to +180 minutes.
					if(now.getHours() > 20 && hhmm[0] < 3){
						hhmm[0] = hhmm[0]*1 + 24; 
					}
					const showtime = hhmm[0]*60 + hhmm[1]*1;
					const nowtime = now.getHours()*60 + now.getMinutes();
					if(showtime > nowtime && nowtime + 180 > showtime){
						//console.log("time:",$(ele).text());
						return ele;
					}
				}
			}).map((index,obj)=>{
				//console.log($(obj).text());
				return $(obj).text();
			}).get()],

		}
		}).get();
	//merge identical theater results.
	//console.log("repeated:",repeated);
	let head = repeated[0]-1;
	for(let i = 0; i < repeated.length; i++){
		result[head].type = result[head].type.concat(result[repeated[i]].type);
		result[head].times = result[head].times.concat(result[repeated[i]].times);
		result[repeated[i]] = {};
		head = (repeated[i]+1 === repeated[i+1]) ? head : repeated[i+1]-1;
	}
	return result;
}

function getAreaID(area){
	/*
	load file "theaterArea.json" and get theaterID.
	*/
	let rawdata;
	try{
		rawdata = fs.readFileSync('theaterArea.json');
	}catch(err){
		console.log("Get raw data from theaterArea.json failed.... :", err);
	}
	//transform the raw data to object.
	let data = JSON.parse(rawdata);
	return data[area];
}