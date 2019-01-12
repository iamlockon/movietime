/*
Get latest posters.
*/

const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
/*
First off, we get filmID to compose the URL....
*/

let result;
axios({
	method:'get',
	url:'http://ww2.atmovies.com.tw/james-parallelism/newfilm.html',
	})
	.then((res)=>{
		let $ = cheerio.load(res.data);
		result = $('.item.thumb img').map((index, obj)=>{
			//console.log("obj",$(obj));
			if($(obj).attr('alt') === "開眼E週報")return undefined;
			return {
				filmID:$(obj).attr('src').split('/')[4],
				filmName:$(obj).attr('alt')
			}
		}).get();
		removeOld('images');
		getPoster();
		
		
	})
	.catch((err)=>{
		console.log("Failed to get filmID...: ",err);
	})

/*
Ok, now we get filmID in "result", let's compose the URL....
The poster URL looks something like 
"http://app2.atmovies.com.tw/poster/filmID/"
and the selector of the element is $('.shadow1 a'), the poster URL is
in "href" attribute. 
*/
async function getPoster(){

	for(let i = 0; i<result.length; i++){
		axios({
			method:'get',
			url:`http://app2.atmovies.com.tw/poster/${result[i].filmID}/`,
			})
			.then((res)=>{
				let $ = cheerio.load(res.data);
				let a = $('.shadow1 a');
				let imgurl = $(a[0]).attr('href');
				//console.log($(a[0]).attr('href'));
				//Get images
				const dest = `./images/${result[i].filmID}.jpg`;
				let file = fs.createWriteStream(dest);
				axios.get(imgurl, {
					headers:{
						'Referer': 'http://app2.atmovies.com.tw/poster/fskr47046974/',
						'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
	
					},
					responseType:'stream'

								})
					.then((res)=>{
						res.data.pipe(file);
						file.on('finish', ()=>file.close(()=>console.log(`${result[i].filmID} downloaded..`)));
					})
					.catch((err)=>{
						fs.unlink(dest, ()=>{
							console.log(`Download ${imgurl} failed....: `, err);
						});
					});

			})
			.catch((err)=>{
				console.log("Failed to get filmID...: ",err);
			})
		
	}

}

function removeOld(path){
	/***
	utility function to remove all files in directory of "path".
	***/
	//get all images in ./images
	let files = fs.readdirSync(path);
	//remove 'em
	for (const file of files){
		try{
			fs.unlinkSync(`${path}/${file}`);
		}catch(err){
			console.log("removeOld failed...");
		}
	}
}