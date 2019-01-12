/*
Get Area ID and store it in "theaterArea.json".

result format:
  XX : areaID
*/
const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');


axios.get('http://www.atmovies.com.tw/showtime/')
	.then((res)=>{
		let $ = cheerio.load(res.data);
		const result = {};
		$('.theaterArea li a').slice(1).map((index,obj)=>{
			result[$(obj).text().trim()] = $(obj).attr('href').split('/')[4];			
		});
		//console.log(result);
		const data = JSON.stringify(result, null, 2);
		try{
			fs.writeFileSync('theaterArea.json', data);
		}catch(err){
			console.log("Write file failed..:", err);
		}

	})
	.catch((err)=>console.log("Get Area ID failed....:", err));