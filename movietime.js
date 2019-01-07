/*
Inspired by https://ithelp.ithome.com.tw/articles/10192478
*/

const request = require('request');
const cheerio = require('cheerio');

//Graphic UI?

// getClosestMovieTime(process.argv[2], process.argv[3],(result)=>{
// 	console.log(result);
// });


module.exports = {

	getClosestMovieTime : async function getClosestMovieTime(movie, area, callback){
		let ID, areaID;
		try{
			ID = await getMovieID(movie);
			areaID = await getAreaID(area);
		}catch(err){
			console.log(err);
		}
		//let now = new Date(2019,1,1,10,10);
		let now = new Date();
		console.log(now);
		request('http://www.atmovies.com.tw/showtime/'+ID+'/'+areaID+'/', (err, res, body) => {
			if(err)
				console.log(err);
			let $ = cheerio.load(body);
			let result = $('#filmShowtimeBlock ul').map((index,obj)=>{
				return {
					theater:$(obj).find('.theaterTitle a').text(),
					type:$(obj).find('.filmVersion').text(),
					times:$(obj).find('li').filter((i, ele)=>{
						if($(ele).text().includes('：')){
							let hhmm = $(ele).text().split('：');
							//console.log(hhmm[0]);

							// Beware of arithmetic expressions. hhmm[1]*1 but not hhmm[1] only.
							// Limit the time range to +180 minutes.
							if(hhmm[0]*60 + hhmm[1]*1 > now.getHours()*60 + now.getMinutes()*1 || hhmm[0]*60 + hhmm[1]*1 < now.getHours()*60 + now.getMinutes()*1 + 180){
								return ele;
							}
						}
					}).map((index,obj)=>{
						return $(obj).text();
					}).get()
	    		}
			}).get();
			//console.log(result);
			callback(result);
		})
		//});
		
	}
};

function getMovieID(movie){
	return new Promise((resolve, reject)=>{
		request('http://www.atmovies.com.tw/movie', (err, res, body) => {
			if(err)
				reject(err);
			let $ = cheerio.load(body);
			let re = new RegExp(movie, "i");
			
	    	let result =  $('select[name=film_id] option').filter((index, obj) => {
	      		return re.test($(obj).text())
	    	}).val();
	    	//console.log("getMovieID : ",result);
	    	resolve(result);
	    })
	});
}
function getAreaID(area){
	return new Promise((resolve, reject)=>{
		request('http://www.atmovies.com.tw/movie', (err, res, body) => {
			if(err)
				reject(err);
			let $ = cheerio.load(body);
			let re = new RegExp(area, "i");
	    	let result =  $('select[name=area] option').filter((index, obj) => {
	      		return re.test($(obj).text())
	    	}).val();
	    	//console.log("getAreaID : ", result);
	    	resolve(result);
	    });
	})
}