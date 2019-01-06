/*
Inspired by https://ithelp.ithome.com.tw/articles/10192478
*/

const request = require('request');
const cheerio = require('cheerio');

//Graphic UI?


getClosestMovieTime(process.argv[2],process.argv[3],'Thu, 03 Jan 2019 20:00:00',(result)=>{
	console.log(result);
});


async function getClosestMovieTime(movie, area, time, callback){
	let ID = await getMovieID(movie);
	let areaID = await getAreaID(area);
	let now = new Date(Date.parse(time));
	//console.log(now);
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
						const hhmm = $(ele).text().split('：');
						// Beware of arithmetic expressions. hhmm[1]*1 but not hhmm[1] only.
						if(hhmm[0]*60 + hhmm[1]*1 > now.getHours()*60 + now.getMinutes()*1){
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