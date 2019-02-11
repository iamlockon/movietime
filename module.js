
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
//const axios = require('axios');

const areas ={
  "基隆": "a01",
  "台北": "a02",
  "桃園": "a03",
  "新竹": "a35",
  "苗栗": "a37",
  "台中": "a04",
  "彰化": "a47",
  "雲林": "a45",
  "南投": "a49",
  "嘉義": "a05",
  "台南": "a06",
  "高雄": "a07",
  "宜蘭": "a39",
  "花蓮": "a38",
  "台東": "a89",
  "屏東": "a87",
  "澎湖": "a69",
  "金門": "a68"
}

let map;
var infowindow;
let service;
let pyrmont;
let city;

let markers = [];



function initMap() {
  const options = {
    timeout: 5000,
    maximumAge: 3600*1000
  };
  
  const image = {
    url: 'https://material.io/tools/icons/static/ic_icons_192px_light.svg',
    scaledSize: new google.maps.Size(25, 25)
  };
  if(!navigator.geolocation){
    alert("此瀏覽器不支援HTML5 Geolocation。");
    throw new Error("HTML5 Geolocation API not supported...");
  }
  navigator.geolocation.getCurrentPosition(success, error, options);
  function success(position) {
    pyrmont = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
    getCity(pyrmont, (res)=>{
      if(res !== undefined)city = res;
    });
    //console.log("lat:",position.coords.latitude, "lng:", position.coords.longitude);
    //console.log("pyrmont:",pyrmont);
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12
    });7
    map.setCenter(pyrmont);
    const marker = new google.maps.Marker({
    map: map,
    position: pyrmont,
    icon: image,
    });
    infowindow = new google.maps.InfoWindow();
  };

  function error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
    if(err.code === 1)
      alert("取得位置失敗，請開啟定位，並使用高精確度模式。");
    else if(err.code === 2)
      alert("取得位置失敗，裝置回傳之位置資訊錯誤，請稍後再試。");
    else
      alert("取得位置逾時，請確認定位是否已開啟，並請稍後再試。");
  };


}

function getTheaterLocation(e) {
  if(city === undefined){
    alert("尚未取得位置資訊，請稍候...");
    return;
  }
  if(city === '新北'){
    city = '台北';
  }
  removeMarker();
  TweenLite.to(window, 0.7,{scrollTo:"#map"}); 
  //console.log("e=",e);
  //retrieve the showtime from backend.
  /*
  city: "XX" in zh-TW 
  movie: filmID
  */
  const url = '/nearestshowtime?area='+city+'&movie='+e.target.getAttribute('alt');
  fetch(url,{
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/4.0 MDN Example',
      'content-type': 'application/json',
    }
  })
  .then(function(response){
    return response.json();
  })
  .then(async function(myJson){
    //Json data here.
    if(myJson.length === 0){
      //no showtime
      alert("很抱歉，您所在縣市電影院3小時內無相關場次資料。");
      return;
    }

    //process
    //console.log("myJson before filter", myJson);
    myJson = myJson.filter((ele)=>{
      if(ele.times === undefined)return false;
      for(let i = 0; i< ele.times.length;i++){
        //if(ele.times[i] === undefined)return false;
        if(ele.times[i].length > 0)return true;
      }
      return false;
    });
    if(myJson.length === 0){
      //no showtime
      alert("很抱歉，您所在縣市電影院3小時內無相關場次資料。");
      return;
    }

    //get LatLng of theaters with axios
    // request url like: /theaterinfo/a02 
    //console.log("module.js line 126, city=",city," areas.city=",areas[city]);
    axios.get(`/theaterinfo?area=${areas[city]}`)
      .then((theaterdata)=>{
        //console.log("theaterdata= ", theaterdata);
        let count = 0;
        for (const showtimedata of myJson){ 
          //showtimedata : {theater: "XX", type:Array, times:Array}, get LatLng from the file
          //20190211 fix showtime theater's name issue: 
          //add unique theaterID in showtimedata object.
          let th = showtimedata.theaterID;
          if(theaterdata.data[th] === undefined){
            console.log("theaterdata is undefined...:",showtimedata);
            throw "error";
          }
          console.log(count++);
          createMarker(theaterdata.data[showtimedata.theaterID], showtimedata);
        }
      })
      .catch((err)=>console.log("Get theaterinfo failed... :",err));
    
    
  })
  .catch((err)=>{
    console.log(err);
  })
}

// function sleep(milli) {
//   return new Promise(resolve => setTimeout(resolve, milli));
// }

function getCity(place, citycallback){
  let geocoder = new google.maps.Geocoder();

  geocoder.geocode({'latLng':place}, (results, status)=>{
    if(status === google.maps.GeocoderStatus.OK){
      if(results){
        //console.log(results[0]["address_components"][2].short_name);
        citycallback(results[0]["formatted_address"].slice(5,7));
      }
    }
    else{
      alert("Reverse Geocoding failed, FAILED_CODE: " + status);
    }
  })
}


function createMarker(latLng, showtimedata) {
  
  let marker = new google.maps.Marker({
    map: map,
    position: latLng
  });
  markers.push(marker);
  let str =`<h3><a href="https://www.google.com/maps/search/?api=1&query=${showtimedata.theater}">`+showtimedata.theater+"</a></h1>";
  for(let i = 0; i < showtimedata.type.length; i++){
    if(showtimedata.times[i].length !== 0)
      str += "<h4>" +showtimedata.type[i]+"</h4>"+"<div>放映時間：</div>";
    for(const time of showtimedata.times[i]){
      str += "<h4>"+ time + "</h4>";
    }
  }
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(str);
    infowindow.open(map, this);
  });
}

function removeMarker(){
  for(const ma of markers){
    ma.setMap(null);
  }
  markers.length = 0;
}