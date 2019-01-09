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

	loadPoster : function loadPoster(callback){
  		request('http://ww2.atmovies.com.tw/james-parallelism/newfilm.html', (err, res, body)=>{
  			if(err){
  				console.log(err);
  			}
  			let $ = cheerio.load(body);
  			//console.log("pre map, result= ", $('.item.thumb img'));
  			let result = $('.item.thumb img').map((index, obj)=>{
  				//console.log("obj",$(obj));
  				if($(obj).attr('alt') === "開眼E週報")return undefined;
  				return {
  					src:$(obj).attr('src'),
  					alt:$(obj).attr('alt')
  				}
  			}).get();
  			//console.log($('.inner img'));
  			console.log(result);
  			callback(result);
  		})
	},

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
		//console.log(now);
		request('http://www.atmovies.com.tw/showtime/'+ID+'/'+areaID+'/', (err, res, body) => {
			if(err)
				console.log(err);
			let $ = cheerio.load(body);
			let repeated = [];
			let result = $('#filmShowtimeBlock ul').map((index,obj)=>{
				let cur = $('#filmShowtimeBlock ul')[index];
				let next = $('#filmShowtimeBlock ul')[index+1];
				console.log("A:",$(cur).find('.theaterTitle a').text()," B:",$(next).find('.theaterTitle a').text());
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
							if(hhmm[0] < 3)
								hhmm[0] = hhmm[0]*1 + 24; 
							const showtime = hhmm[0]*60 + hhmm[1]*1;
							const nowtime = now.getHours()*60 + now.getMinutes();
							if(showtime > nowtime && nowtime + 180 > showtime){
								return ele;
							}
						}
					}).map((index,obj)=>{
						return $(obj).text();
					}).get()],

	    		}
				}).get();
			//merge identical theater results.
			console.log("repeated:",repeated);
			let head = repeated[0]-1;
			for(let i = 0; i < repeated.length; i++){
				result[head].type = result[head].type.concat(result[repeated[i]].type);
				result[head].times = result[head].times.concat(result[repeated[i]].times);
				result[repeated[i]] = {};
				head = (repeated[i]+1 === repeated[i+1]) ? head : repeated[i+1]-1;
			}

			//console.log(result)
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