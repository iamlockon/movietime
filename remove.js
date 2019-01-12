const fs = require('fs');
let path = "abc";

removeOld(path);

function removeOld(path){
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