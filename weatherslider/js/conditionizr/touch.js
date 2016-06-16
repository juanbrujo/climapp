jQuery(function($){
	var geocoder;
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
	} 
	function successFunction(position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		codeLatLng(lat, lng)
	}
	function errorFunction(){
		ciudad = geoip_city();
		pais = geoip_country_name();
		$('#weatherslider').weatherSlider({
			locations : [ciudad+', '+pais]
		});
	}
	function initialize() {
		geocoder = new google.maps.Geocoder();
	}
	function codeLatLng(lat, lng) {
		var latlng = new google.maps.LatLng(lat, lng);
		geocoder.geocode({
			'latLng': latlng
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
//				console.log(results);
		    	if (results[1]) {
		     		ciudad = results[0].address_components[3].long_name;
		     		pais = results[0].address_components[6].long_name;
					for (var i=0; i<results[0].address_components.length; i++) {
		        	for (var b=0;b<results[0].address_components[i].types.length;b++) {
		        	if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
		           		city= results[0].address_components[i];
		           		break;
		        	}
		    	}
			}
	    	$('#weatherslider').weatherSlider({
				locations : [ciudad+', '+pais]
			});
			} else {
//	    		console.log("Sin resultados");
			}
		} else {
//			console.log("Geocoder falló por el siguiente motivo: " + status);
		}
		});	
	}
	initialize();
	var alto = $('body').height();
//	$('.touch #weatherslider').css('height',alto+80);
	
	var $emitter = $('#emitter'),
    emitEvery = 50,
    removeAfter = 1000;
	function create() {
	  var $particle = $('<div class="particle" />'),
	      x = Math.randMinMax(-200, 200),
	      y = Math.randMinMax(-200, 50),
	      z = Math.randMinMax(-200, 200),
	      degree = Math.randMinMax(0, 360),
	      color = 'hsla(' + Math.randMinMax(10, 120) + ', 100%, 100%, 1)';
	  $particle.css('background', color);            
	  $emitter.append( $particle );
	  window.setTimeout(function() {
	    $particle.css({
	      webkitTransform: 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(' + z + 'px) rotateX(' + degree + 'deg)',
	      opacity: 0
	    }); 
	  }, 50);
	  window.setTimeout(function() {
	    $particle.remove();
	  }, removeAfter);
	  window.setTimeout(create, emitEvery); 
	}
	Math.randMinMax=function(t,n,a){var r=t+Math.random()*(n-t)
	return a&&(r=Math.round(r)),r}
	create();
});

window.onload = function() {
	setTimeout(function(){
		window.scrollTo(0, 1);
	});
}