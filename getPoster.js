/*
Get latest posters.
*/

const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

const {Storage} = require('@google-cloud/storage');
const projectId = 'movie-1546758871417';
const storage = new Storage();

const bucketName = 'movie-1546758871417.appspot.com';
/*
First off, we get filmID to compose the URL....
*/

let result;

module.exports = {

	getFilm : function getFilm(){
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
				return removeOld(bucketName);
			})
			.then(()=>{
				getPoster(result);
			})
			.catch((err)=>{
				console.log("Failed to get filmID...: ",err);
			})
		}
}

/*
Ok, now we get filmID in "result", let's compose the URL....
The poster URL looks something like 
"http://app2.atmovies.com.tw/poster/filmID/"
and the selector of the element is $('.shadow1 a'), the poster URL is
in "href" attribute. 
*/
function getPoster(result){

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
				const filename = `${result[i].filmID}.jpg`;
				const mybucket = storage.bucket(bucketName);
				const file = mybucket.file(filename);
				//let file = fs.createWriteStream(filename);
				axios.get(imgurl, {
					headers:{
						'Referer': 'http://app2.atmovies.com.tw/poster/',
						'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
	
					},
					responseType:'stream'

								})
					.then((res)=>{
						res.data.pipe(file.createWriteStream({gzip:true}))
								.on('error', (err)=>console.log("Error writing to GCP:", err))
								.on('finish', ()=>{
									//file upload complete.
								})
					})
					.catch((err)=>{
						console.log(`Error getting ${imgurl}...: `, err);
					});

			})
			.catch((err)=>{
				console.log("Failed to get posters...: ",err);
			})
		
	}

}



function removeOld(bucketName){
	/***
	utility function to remove all files in the bucket.
	***/
	return new Promise(async (resolve)=>{
		const [files] = await storage.bucket(bucketName).getFiles();
		for (const file of files){
			try{
				await storage
				  .bucket(bucketName)
				  .file(file.name)
				  .delete();
				
			}catch(err){
				console.log(`Error when deleting gs://${bucketName}/${file.name}...`,err);
			}
			console.log(`gs://${bucketName}/${file.name} deleted.`);	
		}
		resolve();
	})
		
}