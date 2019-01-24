/*
Inspired by https://ithelp.ithome.com.tw/articles/10192478
*/

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
//Graphic UI?

// getClosestMovieTime(process.argv[2], process.argv[3],(result)=>{
// 	console.log(result);
// });


module.exports = {


	getClosestMovieTime : async function getClosestMovieTime(movie, area, callback){
		/*
		movie:filmID
		area: "XX" in zh-TW
		*/
		let areaID;
		areaID = getAreaID(area);
		//let now = new Date(2019,1,1,10,10);
		//For Localtest
		let now = new Date();
		//For GCP
		now.setHours(now.getHours() + 8);
		
		//console.log(now);
		request('http://www.atmovies.com.tw/showtime/'+movie+'/'+areaID+'/', (err, res, body) => {
			if(err)
				console.log(err);
			let $ = cheerio.load(body);
			let repeated = [];
			if($('#filmShowtimeBlock ul').length === 0){
				console.log("empty");
				callback([]);
			}else{
				const sel = $('#filmShowtimeBlock ul');
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

				//console.log(result)
				callback(result);
			}
		})
	}
};

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