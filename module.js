
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
let gmap;
var map;
var infowindow;
let service;
let pyrmont;
let city;
function initMap() {
  gmap = google.maps;
  console.log("pre map creation");
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15
  });
  const image = {
    url: 'https://material.io/tools/icons/static/ic_icons_192px_light.svg',
    scaledSize: new google.maps.Size(25, 25)
  }
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      pyrmont = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      getCity(pyrmont, (res)=>{
        city = res;
      });
      console.log("lat:",position.coords.latitude, "lng:", position.coords.longitude);
      console.log("pyrmont:",pyrmont);
      map.setCenter(pyrmont);
      const marker = new google.maps.Marker({
      map: map,
      position: pyrmont,
      icon: image,
      });
      infowindow = new google.maps.InfoWindow();
      
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
  
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}



function createMarker(place, placedata) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });
  let str ="<div></div>";
  for(const time of placedata.times){
    str += "<h1>"+ time + "</h1>";
  }
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name+"\n放映時間：\n"+placedata.times);
    infowindow.open(map, this);
  });
}

function getTheaterLocation(e) {
  console.log("e=",e);
  //retrieve the showtime from backend.
  let service = new google.maps.places.PlacesService(map);
  // service.nearbySearch({
  //   location: pyrmont,
  //   radius: '7000',
  //   keyword: '電影院'
  // }, callback);
  console.log(city);
  const url = 'http://localhost:3000/nearestshowtime?area='+city+'&movie='+e.target.getAttribute('alt');
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
  .then(function(myJson){
    //Json data here.
    
    //process
    myJson = myJson.filter((ele)=>{
      return ele.times.length !== 0;
    });
    console.log("myJson=",myJson);
    for (let placedata of myJson){
      console.log(placedata);
      service.textSearch({
      location: pyrmont,
      query: placedata.theater,
    },(results, status)=>{
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log(results);
        for (var i = 0; i < results.length; i++) {
          createMarker(results[i], placedata);
        }
      }
    });
    }
  })
  .catch((err)=>{
    console.log(err);
  })
}

function getCity(place, citycallback){
  let geocoder = new google.maps.Geocoder();

  geocoder.geocode({'latLng':place}, (results, status)=>{
    if(status === google.maps.GeocoderStatus.OK){
      if(results){
        console.log(results[0]["address_components"][2].short_name);
        citycallback(results[0]["address_components"][2].short_name.slice(0,2));
      }
    }
    else{
      alert("Reverse Geocoding failed, FAILED_CODE: " + status);
    }
  })
}

function callback(results, status){
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    console.log(results);
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i], placedata);
    }
  }
}
