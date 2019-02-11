/*
Get Theater Info. and store it in "theaterinfo" folder.
*/

const gmapc =require('@google/maps').createClient({
	key: 'AIzaSyCh5dQ-lYoIi8G61RMAeQDLUGfY8fSVv90'
});

const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

let areas = [
	"a01",
	"a02",
	"a03",
	"a35",
	"a37",
	"a04",
	"a47",
	"a45",
	"a49",
	"a05",
	"a06",
	"a07",
	"a39",
	"a38",
	"a89",
	"a87",
	"a69",
	"a68"
];

//Use getAddress first to generate aXX_info.json(without latLng), then use getLocation() to generate complete aXX_info.json.
//getAddress();
getLocation();


async function getAddress(){
	for(const area of areas){
		axios.get(`http://www.atmovies.com.tw/showtime/${area}/`)
			.then((res)=>{
				let $ = cheerio.load(res.data);
				const result = {};
				$('#theaterList').children().map((index,obj)=>{
					if($(obj).find('a[onmouseover]').attr('href') !== undefined){
						//console.log($(obj).find('a[onmouseover]').attr('href'));
						result[$(obj).find('a[onmouseover]').attr('href').split('/')[2]] = $(obj).find('ul li:nth-child(3)').text().trim();
					}
				});
				//console.log(result);
				const data = JSON.stringify(result, null, 2);
				try{
					fs.writeFileSync(`theaterinfo/${area}_info.json`, data);
				}catch(err){
					console.log(`Write file ${area} failed..:`, err);
				}

			})
			.catch((err)=>console.log("Get Theater Info failed....:", err));
	}
}




async function getLocation(){
	for(const area of areas){
		//console.log("begin addr to lagLng process...");
		let rawdata;
		try{
			rawdata = fs.readFileSync(`theaterinfo/${area}_info.json`);
		}catch(err){
			console.log(`Get raw data from theaterinfo/${area}_info.json failed.... :`, err);
		}
		//transform the raw data to object.
		let data = JSON.parse(rawdata);
		//console.log(data);
		//get lagLng-like object.
		//console.log("before getlatLng:", data);
		
		getlatLng(data)
		 .then(()=>{
		 	//console.log("data:",data);
		 	// save file
		 	const result = JSON.stringify(data, null, 2);
		 	try{
		 		fs.writeFileSync(`theaterinfo/${area}_info.json`, result);
		 	}catch(err){
		 		console.log("Write file: `theaterinfo/${area}_info.json` failed..:", err);
		 	}
		 })
		 .catch((err)=>console.log(err));
	}
}
//
function getlatLng(data){
	let arr = [];
	for(const key in data){
		const addr = data[key];
		//console.log("Pre geocoding at", key);
		let mypromise = new Promise((resolve)=>{
			gmapc.geocode({
				address: addr
			},(err, res)=>{
				//console.log("geocoding res get..");
				if(!err){
					//console.log("success");
					const rs = res.json.results;
					const loc = rs[0].geometry.location;
					//console.log("latLng:", loc);
					//const latLng = res.json.results.geometry.location;
					//console.log("res:", res);
					data[key] = loc;
					resolve();
				}else{
					console.log("Geocoding failed at: ",err);
				}
			})
		});
		arr.push(mypromise);
	}
	return Promise.all(arr);
}
