/*
Inspired by https://ithelp.ithome.com.tw/articles/10192478
*/

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');


// getClosestMovieTime(process.argv[2], process.argv[3],(result)=>{
// 	console.log(result);
// });


module.exports = {


	getClosestMovieTime : async function getClosestMovieTime(movie, area, db){
		/**
		*	movie:filmID
		*	area: "XX" in zh-TW
		*/
		let areaID;
		areaID = getAreaID(area);
		//See if db has data.
		let data;
		try{	
			
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
			let collection = db.collection('movies');
			let res = await collection.findOne({name: movie});
			//console.log("res:",res);
			//if db does not have data or data is not updated, request and cache into db first.
			//TODO: ADD DATA TIMESTAMP
			if(!res || !res.showtime){
				let result = await getShowtime(movie, areaID);
				if(result === 'E'){
					result = [];
				}
				let setval = {};
				setval["showtime."+areaID] = result;
				try{
					await collection.updateOne(
						{ "name" : movie },
						{ $set: setval },
						{
							upsert: true
						}
					);
				}catch (e) {
					console.log(e);
				}
			}
			//get all data of the area for the movie from db.
			data = await collection.findOne({name: movie}, {areaID : true});
			//console.log("data: ",data);
			if(data.showtime[areaID].length === 0){
				return [];
			}else{
				//console.log(data.showtime.areaID);
				return processShowtime(data.showtime[areaID]);
			}	
		} catch (err) {
			console.log("Error...:",err);
		}
		
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
				let repeated = [];
				const sel = $('#filmShowtimeBlock ul');
				let result = sel.map((index,obj)=>{
					let cur = sel[index];
					let next = sel[index+1];
					if($(cur).find('.theaterTitle a').text() == $(next).find('.theaterTitle a').text()){
						repeated.push(index+1);
					}
					return {
						theater:$(obj).find('.theaterTitle a').text(),
						type:[$(obj).find('.filmVersion').text()],
						times:[$(obj).find('li').filter((i, ele)=>{
							if($(ele).text().includes('：')){
								return ele;
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
				resolve(result);
			}
		});
	});
}



function processShowtime(data) {
	/** data:[{theater:"A theater", type:[""],times:["10:00","13:00","15:00"]},
	*	{theater:"B theater", type:["A","B"],times:[["10:00","13:00","15:00"],["14:30"]}
	*	]
	*/
	//console.log("data:",data);
	return data.map((theater)=>{
		//console.log("theater: ", theater);
		if(Object.entries(theater).length === 0 && theater.constructor === Object)return theater;
		theater.times = theater.times.map((time_arr)=>{
			//for each time array, return the new filtered one.
			return time_arr.filter((time)=>{
				//filter the showtime
				let hhmm = time.split('：');
				//console.log(hhmm[0]);
				
				//For Localtest
				let now = new Date();
				//For GCP
				now.setHours(now.getHours() + 8);
				// Beware of arithmetic expressions. hhmm[1]*1 but not hhmm[1] only.
				// Limit the time range to +180 minutes.
				if(now.getHours() > 20 && hhmm[0] < 3){
					hhmm[0] = hhmm[0]*1 + 24; 
				}

				

				const showtime = hhmm[0]*60 + hhmm[1]*1;
				const nowtime = now.getHours()*60 + now.getMinutes();
				if(showtime > nowtime && nowtime + 180 > showtime){
					//console.log("time:",$(ele).text());
					return time;
				}
			});
		});
		return theater;
	});
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