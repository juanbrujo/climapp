
/*
	* WeatherSlider
	*
	* (c) 2011-2013 George Krupa, John Gera & Kreatura Media
	*
	* web:					http://kreaturamedia.com/
	* Facebook: 			http://facebook.com/kreaturamedia/
	* standalone version: 	http://kreaturamedia.com/codecanyon/plugins/weatherslider/
	* WordPress version: 	http://wordpress.kreatura.hu/weathersliderwp/
	* email: 				contact<AT>kreaturamedia<DOT>com
	*
	* Licenses:
	*
	* http://codecanyon.net/licenses/
*/



(function($) {

	$.fn.weatherSlider = function( options ){

		// Initializing

		if( (typeof(options) ).match('object|undefined') ){
			return this.each(function(i){
				new $.weatherSlider(this, options);
			});
		}else{
			return this.each(function(i){

				// Change function

				var wsData = $(this).data('WeatherSlider');
				if( wsData && !wsData.g.isAnimating ){
					if( typeof(options) == 'number' ){
						wsData.change(options);
					}
				}
			});
		}
	};

	$.weatherSlider = function(el, options) {

		var ws = this;
		ws.$el = $(el).addClass('ws-container');
		ws.$el.data('WeatherSlider', ws);

		ws.init = function(){

			// Setting options (user settings) and global (not modificable) parameters

			ws.o = $.extend( {}, $.weatherSlider.options, options );

			// NEW FEATURE v2.0 Change language without modifying the script

			if( ws.o.language ){
				ws.l = ws.o.language;
			}else{
				ws.l = $.extend( {}, $.weatherSlider.language );				
			}

			ws.w = $.extend( {}, $.weatherSlider.weatherTypes );
			ws.g = $.extend( {}, $.weatherSlider.global );

			// Future feature SSL - currently: Premium WWO account needed :(
			
			if( ws.o.SSL ){
				ws.g.SSL = 'https'
			}else{
				ws.g.SSL = 'http'
			}

			// NEW FEATURE v2.1 Transparent Background
			
			if( ws.o.hideBackground ){
				$(el).addClass('ws-transparent');				
			}
			
			// NEW FEATURE v2.0 Storing original width and height for responsive mode
			
			$(el).data('originalWidth',$(el).width());
			$(el).data('originalHeight',$(el).height());
			
			ws.g.curWidth = $(el).width();
			ws.g.curHeight = $(el).height();

			// Setting size for the first time

			ws.setSize(true);

			$(el).css({
				width : ws.g.curWidth,
				height : ws.g.curHeight
			});

			// Setting the container's position to realtive if required
			
			if( $(el).css( 'position' ) == 'static' ){
				$(el).css( 'position', 'relative' );
			}						

			// Saving reduction

			ws.g.reduction = ws.o.reduction;

			// Getting locations

			if( ws.o.locations ){
				ws.g.locations = ws.o.locations;
			}else{

				ws.g.locations = [];

				// NEW FEATURE v2.0 Loading custom location from cookie

				if( ws.o.enableSearchField ){

					var i,x,y,ARRcookies=document.cookie.split(";");
					for( i = 0 ; i < ARRcookies.length; i++ ){
						x = ARRcookies[i].substr( 0,ARRcookies[i].indexOf("=") );
						y = ARRcookies[i].substr( ARRcookies[i].indexOf("=") + 1 );
						x = x.replace(/^\s+|\s+$/g,"");
						if( x=='ws-custom-search-0' ){
							ws.g.customLocation = unescape(y);
							$('<span class="ws-location ws-customlocation">'+ws.g.customLocation+'</span>').prependTo( $(el) );
						}
					}
				}

				$(el).find('.ws-location').each(function(){
					ws.g.locations.push( $(this).html() );
				});				
			}

			// Adding keyboard navigation if turned on

			if( ws.o.keybNav ){
				
				$('body').bind('keydown',function(e){ 
					if( !ws.g.isAnimating ){
						if( e.which == 37 ){
							$(el).find('.ws-prev-arrow').click();
						}else if( e.which == 39 ){
							$(el).find('.ws-next-arrow').click();
						}
					}
				});
			}

			// Adding touch-control if turned on
			
			if( ws.o.touchNav ){

				if('ontouchstart' in window){

				   $(el).bind('touchstart', function( e ) {
						var t = e.touches ? e.touches : e.originalEvent.touches;
						if( t.length == 1 ){
							ws.g.touchStartX = ws.g.touchEndX = t[0].clientX;
						}
				    });

				   $(el).bind('touchmove', function( e ) {
						var t = e.touches ? e.touches : e.originalEvent.touches;
						if( t.length == 1 ){
							ws.g.touchEndX = t[0].clientX;

							$(el).find('.ws-fullbg, .ws-bottombg, .ws-rain, .ws-snow, .ws-clouds, .ws-sunmoon, .ws-fog, .ws-icy').css({
								opacity : $(el).width() / ( $(el).width() + Math.abs( ws.g.touchStartX - ws.g.touchEndX ) * 3 )
							});

							if( Math.abs( ws.g.touchStartX - ws.g.touchEndX ) > 45 ){
								e.preventDefault();							
							}
						}
				    });


					$(el).bind('touchend',function( e ){
						if( Math.abs( ws.g.touchStartX - ws.g.touchEndX ) > 45 ){
							if( ws.g.touchStartX - ws.g.touchEndX > 0 ){
								$(el).find('.ws-prev-arrow').click();							
							}else{
								$(el).find('.ws-next-arrow').click();
							}
						}else{

							$(el).find('.ws-fullbg, .ws-bottombg, .ws-rain, .ws-snow, .ws-clouds, .ws-sunmoon, .ws-fog, .ws-icy').css({
								opacity : 1
							});					
						}
					});
				}	
			}	

			if( ws.o.responsive ){
				$(window).resize(function(){
					if( ws.g.resizeTimer ){
						clearTimeout( ws.g.resizeTimer );
					}
					ws.g.resizeTimer = setTimeout(function(){
						ws.setSize();
					}, 500);
				});
			}

			ws.reInit();
		};

		ws.reInit = function(){

			ws.g.sliderWidth = $(el).width();
			ws.g.sliderHeight = $(el).height();
			ws.g.bgPosY = ( ws.g.sliderHeight - 600 ) / 2;

			// Setting reduction

			ws.o.reduction = ws.g.reduction;

			if( ws.o.reduction == 'auto' ){
				ws.o.reduction = ws.g.sliderWidth / 900;
				ws.o.reduction = ws.o.reduction > 1 ? 1 : ws.o.reduction;
			}else if(typeof(parseFloat(ws.o.reduction)) == 'number' ){
				ws.o.reduction = parseFloat(ws.o.reduction);
				ws.o.reduction = ws.o.reduction < 0 ? 0 : ws.o.reduction;
				ws.o.reduction = ws.o.reduction > 1 ? 1 : ws.o.reduction;
			}else {
				ws.o.reduction = 1;
			}

			// Creating navigation if multiple locations added

			if( ws.g.locations.length > 1 ){

				$('<a href="#"></a>').appendTo( $(el) ).addClass('ws-nav ws-prev-arrow');
				$('<a href="#"></a>').appendTo( $(el) ).addClass('ws-nav ws-next-arrow');
				$('<span></span>').appendTo( $(el).find('.ws-prev-arrow') ).addClass('ws-prev-text');
				$('<span></span>').appendTo( $(el).find('.ws-next-arrow') ).addClass('ws-next-text');

				$(el).find('.ws-prev-arrow, .ws-next-arrow').css({
					backgroundImage : 'url('+ws.o.imgPath+'sprite.png)'
				});

				$(el).find('.ws-prev-arrow').mousemove(function(){
					$(this).find('.ws-prev-text').fadeIn(200);
				});
				$(el).find('.ws-prev-arrow').mouseleave(function(){
					$(this).find('.ws-prev-text').fadeOut(200);
				});

				$(el).find('.ws-next-arrow').mousemove(function(){
					$(this).find('.ws-next-text').fadeIn(200);
				});
				$(el).find('.ws-next-arrow').mouseleave(function(){
					$(this).find('.ws-next-text').fadeOut(200);
				});

				$(el).find('.ws-prev-text, .ws-next-text').css({
					width : $(el).width() * .6
				});
			}

			// Creating inner div and loading

			$('<div></div>').appendTo($(el)).addClass('ws-inner');
			$('<div><div class="multi"><div></div></div>'+ws.l.get+'<span></span></div>').appendTo($(el)).addClass('ws-loading');

			// NEW FEATURE v2.0 Creating and configuring searchbox

			if( ws.o.enableSearchField ){

				var searchText = $(el).find('.ws-customlocation').length ? $(el).find('.ws-customlocation').text() : ws.l.search;

				var s = '<div class="ws-search">';
						s += '<div class="ws-search-hidden">';
							s += '<div class="ws-searchbox">';
								s += '<div class="ws-bg"></div>';
								s += '<input name="wp-search" value="'+searchText+'">';
							s += '</div>';
						s += '</div>';
					s += '</div>';

				$(s).appendTo($(el));
				
				$(el).find('.ws-search input').click(function(){
					if( $(this).val() == ws.l.search ){
						$(this).val('');
					}
				});

				$(el).find('.ws-search input').keyup(function(){
					if( ws.g.sTimer ){
						clearTimeout( ws.g.sTimer );
					}
					var val = $(this).val();
					if( val != ws.g.curSearchValue && val != '' ){
						ws.g.sTimer = setTimeout( function(){
							ws.g.curSearchValue = val;
							ws.change(ws.g.curID,val)
						}, 1000 );
					}
				});

				// Forbid to change slides with the arrow keys

				$(el).find('.ws-search input').keydown(function(e){
					e.stopPropagation();
				});

				// Setting searchbox font size

				ws.animateIn( $(el).find('.ws-searchbox') );

				// Setting searchbox visibility

				var showSearch = function(){
					ws.g.curSearchValue = $(el).find('.ws-search input').val();
					$(el).find('.ws-search-hidden').stop().animate({
						height : $(el).find('.ws-searchbox').height() * 1.25
					}, 450, 'easeInOutQuart');					
				};

				var hideSearch = function(){
					$(el).find('.ws-search-hidden').stop().animate({
						height : 0
					}, 250, 'easeInOutQuart', function(){
						$(el).find('.ws-focushelper').focus().remove().appendTo( $(el).find('.ws-infobox .ws-bg') );
						if( $(this).find('input').val() == '' ){
							ws.setSearchCookie('ws-custom-search-0',$(this).find('input').val(),-1);								
							$(this).find('input').val(ws.l.search);
						}
					});					
				};

				// NEW FEATURE v2.2 always show search field feature

				if( ws.o.alwaysShowSearch ){
					showSearch();
					$(el).find('.ws-search-hidden').find('input').blur(function(){
						if( $(this).val() == '' ){
							ws.setSearchCookie('ws-custom-search-0',$(this).val(),-1);								
							$(this).val(ws.l.search);
						}						
					});
					
				}else{
					$(el).find('.ws-search').hover(
						function(){
							showSearch();
						},
						function(){
							hideSearch();
						}
					);					
				}
			}

			// Creating infobox

			if( ws.o.enableWeatherInfo ){

				var i = '<div class="ws-infobox">';
				//i += '<div class="ws-bg"><a class="ws-focushelper" href="#"></a></div>';
				i += '<div class="ws-iinner"></div>';
				i += '</div>';

				$(i).appendTo($(el).find('.ws-inner'));

				// CHANGED v2.2 because of jQuery 1.9 compatibility

				$(el).on('click', '.ws-focushelper', function(e) {
					e.preventDefault();
				});

				// Binding hover function for infobox to show forecast if ws.o.enableForecast is true

				if( ws.o.enableForecast && !ws.o.alwaysShowForecast ){

					if( 'ontouchstart' in window == false ){
						$(el).find('.ws-infobox').hover(
							function(){
								if( ws.g.locations.length > 1 ){					
									if(!ws.g.oldIE){
										$(el).find('.ws-nav').fadeOut(400);
									}else{
										$(el).find('.ws-nav').css('visibility','hidden');
									}
								}

								$(this).find('.ws-forecast').stop().animate({
									height: $(this).find('.ws-finner').innerHeight()
								}, 400, 'easeInOutQuad');
								$(el).find('.ws-search').css({
									display : 'none'
								});
							},
							function(){
								$(this).find('.ws-forecast').stop().animate({
									height: 0
								}, 200, 'easeInOutQuad',function(){
									if( ws.g.locations.length > 1 ){					
										if(!ws.g.oldIE){
											$(el).find('.ws-nav').fadeIn(400);
										}else{
											$(el).find('.ws-nav').css('visibility','visible');						
										}
									}
								});
								$(el).find('.ws-search').css({
									display : 'block'
								});
							}
						);
					}else{

						// Infobox touch control

						if( ws.g.locations.length > 1 ){

							$(el).find('.ws-infobox').bind('touchstart', function( e ) {
									var t = e.touches ? e.touches : e.originalEvent.touches;
									if( t.length == 1 ){
										ws.g.touchStartInfoY = ws.g.touchEndInfoY = t[0].clientY;
									}
							 });

							$(el).find('.ws-infobox').bind('touchmove',function( e ){
								e.preventDefault();
								var t = e.touches ? e.touches : e.originalEvent.touches;
								if( t.length == 1 ){
									ws.g.touchEndInfoY = t[0].clientY;

									if( ws.g.touchStartInfoY - ws.g.touchEndInfoY > 0 && $(el).find('.ws-infobox .ws-forecast').height() < $(el).find('.ws-infobox .ws-forecast .ws-finner').innerHeight() ){
											$(el).find('.ws-infobox .ws-forecast').css({
												height: ws.g.touchStartInfoY - ws.g.touchEndInfoY
											});
									}

									if( ws.g.touchStartInfoY - ws.g.touchEndInfoY < 0  && $(el).find('.ws-infobox .ws-forecast').height() > 0 ){							
										$(el).find('.ws-infobox .ws-forecast').css({
											height: $(el).find('.ws-infobox .ws-forecast').height() + ws.g.touchStartInfoY - ws.g.touchEndInfoY
										});							
									}
								}					
							});				

							$(el).find('.ws-infobox').bind('touchend',function( e ){
								if( ws.g.touchStartInfoY - ws.g.touchEndInfoY > 0 ){
									$(el).find('.ws-nav').fadeOut(400);
									$(el).find('.ws-infobox .ws-forecast').stop().animate({
										height: $(this).find('.ws-finner').innerHeight()
									}, 400, 'easeInOutQuad');
									$(el).find('.ws-search').css({
										display : 'none'
									});
								}else{
									$(el).find('.ws-infobox .ws-forecast').stop().animate({
										height: 0
									}, 200, 'easeInOutQuad',function(){
										if( ws.g.locations.length > 1 ){					
											$(el).find('.ws-nav').fadeIn(400);
										}
									});
									$(el).find('.ws-search').css({
										display : 'block'
									});															
								}
							});
						}
					}					
				}
			}

			// Getting current location

			$.getScript( ws.g.SSL+'://j.maxmind.com/app/geoip.js', function(){

				if( geoip_country_name() != '' && geoip_city() != '' ){
					ws.g.curLocation = geoip_city() + ', ' + geoip_country_name();
				}else{
					ws.g.curLocation = ws.l.una;
				}

				// Starting with first location

				if( ws.o.WWOAPIKey == 'your_api_key' ){
					alert('WeatherSlider:\r\n\r\nYou must sign up to get your own WorlWeatherOnline API key! Of course the registraion is free:\r\n\r\nhttp://www.worldweatheronline.com/register.aspx');
				}else{
					ws.change(ws.g.curID);
				}
			});
		};

		// setSize function for responsive mode

		ws.setSize = function(firsttime){
			
			if( $(el).parent().width() < ws.g.curWidth || ( $(el).parent().width() != ws.g.curWidth && $(el).parent().width() != ws.g.curWidth && $(el).data('originalWidth') != ws.g.curWidth ) ){
				
				var newW, newH;

				if( $(el).parent().width() < $(el).data('originalWidth') ){
					newW = $(el).parent().width();
					newH = $(el).parent().width() / $(el).data('originalWidth') * $(el).data('originalHeight');
				}else{
					newW = $(el).data('originalWidth');
					newH = $(el).data('originalHeight');
				}

				if( newW > 1300 ){
					newW = 1300;
				}
				if( newW < 240 ){
					neWW = 240;
				}
				if( newH > 600 ){
					newH = 600;
				}
				if( newH < 200 ){
					newH = 200;
				}

				ws.g.curWidth = newW;
				ws.g.curHeight = newH;

				if( !firsttime ){

					$(el).find('*:not(span)').each(function(){
						$(this).stop().fadeOut(300, function(){
							$(this).remove();
						});
					});

					$(el).animate({
						width : ws.g.curWidth,
						height : ws.g.curHeight
					}, 400, 'easeInOutQuad', function(){
						ws.reInit();
					});					
				}
			}
		};

		// Change function
		
		ws.change = function(id,search){

			ws.g.isAnimating = true;

			// If infobox is not empty, we have to stop animations and remove html code from slider

			if( $(el).find('.ws-infobox h1').length ){

				$(el).find('.ws-lightnings').stop().remove();

				if( !ws.g.oldIE ){
					$(el).find('.ws-fullbg, .ws-bottombg, .ws-rain, .ws-snow, .ws-clouds, .ws-sunmoon, .ws-fog, .ws-icy').stop().each(function(){
						$(this).fadeOut(400, function(){
							$(this).remove();
						});
					});					
				}else{
					$(el).find('.ws-bottombg, .ws-rain, .ws-snow, .ws-clouds, .ws-sunmoon, .ws-fog, .ws-icy').stop().remove();
					$(el).stop().find('.ws-fullbg').fadeOut(400, function(){
							$(this).remove();
					});
				}

				if( !ws.g.oldIE ){
					$(el).find('.ws-nav').fadeOut(500);
				}else{
					$(el).find('.ws-nav').fadeOut(1);					
				}

				$(el).find('.ws-infobox').animate({
					marginBottom : -($(el).find('.ws-infobox').outerHeight() - 20)
				}, ws.o.infoDuration, ws.o.infoEasingType[1], function(){
					$(this).find('.ws-iinner *').remove();
					ws.getWeather(id,search);
				});

				// If infobox is empty lets get weather

			}else{

				ws.getWeather(id,search);
			}
		};

		// Getting weather with World Weather Online API

		ws.getWeather = function(id,search){

			// NEW FEATURE v2.1 Custom Location Name
			
			var lname = l = ws.g.locations[id];

			$(el).find('.ws-location').each(function(){
				if( lname == $(this).html() && $(this).attr('title') ){
					lname = $(this).attr('title');
				};
			});

			if( l.indexOf('GEOLOCATION') != -1 ){
				lname = l = ws.g.curLocation;
			}

			if( search ){
				lname = l = search;
			}

			// Showing loading text
			
			$(el).find('.ws-loading span').html(lname);
			$(el).find('.ws-loading').fadeIn(500);

			if( ws.o.ajaxURL ){
				var url = ws.o.ajaxURL;
				var obj = { action : 'weatherslider_getdata', location : l };
			}else{
				var url  = ws.g.SSL + '://api.worldweatheronline.com/free/v1/weather.ashx';
				url += '?key='+ws.o.WWOAPIKey+'';
				url += '&format=json';
				url += '&q='+encodeURIComponent(l)+'';
				url += '&num_of_days=5';
				url += '&callback=?';
				var obj = {};				
			}

			// Creating functions for converting between metric and imperial currency

			var KMtoMI = function(KM){
				
				return Math.round(KM / 1.609344);
			}
			
			var MMtoIN = function(MM){
				
				return Math.round(MM * .03937 * 10000) / 10000;
			}

			function dateToTimestamp(year,month,day,hour,minute,second){
				var timestamp = new Date(Date.UTC(year,month-1,day,hour,minute,second));
				return timestamp.getTime()/1000;
			}

			// Getting weather data from World Weather Online

			$.getJSON(url, obj, function(d){

				var data = d['data'];
				
				// If location found

				if( data['current_condition'] ){

					var cur = data['current_condition'][0];
					var fore;

					// Creating Data object from data

					var wData = {

						// Location

						location : l,

						// Current conditions

						current_condition : {

							weather : {

								condition : ws.l[cur['weatherCode']],
								icon : cur['weatherIconUrl'][0]['value'],
								code : cur['weatherCode']
							},

							temperature : {

								metric : cur['temp_C'],
								imperial : cur['temp_F']
							},

							humidity : cur['humidity'],

							precipitation : {

								metric : cur['precipMM'],
								imperial : MMtoIN(parseInt(cur['precipMM']))
							},

							wind : {

								speed : {

									metric : cur['windspeedKmph'],
									imperial : cur['windspeedMiles']
								},

								direction : cur['winddir16Point']
							},

							pressure : cur['pressure'],

							visibility : {

								metric : cur['visibility'],
								imperial : KMtoMI(parseInt(cur['visibility']))
							}
						}
					}

					// 3 days forecast

					wData['forecast'] = [];

					for(var f=0;f<5;f++){

						fore = data['weather'][f];

						wData.forecast[f] = {

							temperature : {

								high : {

									metric : fore['tempMaxC'],
									imperial : fore['tempMaxF']
								},

								low : {

									metric : fore['tempMinC'],
									imperial : fore['tempMinF']
								}
							},

							weather : {

								code : fore['weatherCode'],
								condition : ws.l[fore['weatherCode']]
							}
						}
					}

					// Getting local time of the location

					url  = ws.g.SSL + '://api.worldweatheronline.com/free/v1/tz.ashx';
					url += '?key='+ws.o.WWOAPIKey+'';
					url += '&format=json';
					url += '&q='+encodeURIComponent(l);
					url += '&callback=?';

					$.getJSON(url, function(d) {

						wData['time'] = d['data'].time_zone[0].localtime.split(' ')[1];
						
						var curDate = d['data'].time_zone[0].localtime.split(' ')[0].split('-');
						var curTime = d['data'].time_zone[0].localtime.split(' ')[1].split(':');
						var timestamp = dateToTimestamp(curDate[0],curDate[1],curDate[2],curTime[0],curTime[1],0);

						var curDay = new Date();
						curDay.setTime(timestamp*1000);
						wData['day'] = curDay.getDay();

						// Trying to set current daytime...
						// If the original weather icon name has 'night' in it, there is certainly night:

						var wIcon = cur['weatherIconUrl'][0]['value'];
						var wCode = cur['weatherCode'];

						if( wIcon.indexOf('_night') != -1 || ( wCode != 122 && wIcon.indexOf('_black') != -1 ) ){
							wData['current_condition']['daytime'] = 'night';
						}else{

							// If not, there is probably day, but in some cases (fog, mist, etc.)
							// there can be night because they don't have special icons for night
							// in these cases using local time and ws.o.daytime

							if( ( parseFloat(curTime[0]) < ws.o.daytime[0] || parseFloat(curTime[0]) > ws.o.daytime[1]-1 ) ){
								wData['current_condition']['daytime'] = 'night';								
							}else{
								wData['current_condition']['daytime'] = 'day';
							}
						}

						if( wCode == '113'){
							switch (wData['current_condition']['daytime']){
								case 'day':
									wData['current_condition']['weather']['condition'] = ws.l['114'];
								break;
								case 'night':
									wData['current_condition']['weather']['condition'] = ws.l['115'];
								break;
							}
						}
						
						ws.parseData(wData,id,lname);
					});

					// NEW FEATURE v2.0 Saving custom location (from search field) 

					if(search){
						ws.setSearchCookie('ws-custom-search-0',search,365);						
					}

				// If location has not found

				}else{

					var lText = $(el).find('.ws-loading span').html();
					$(el).find('.ws-loading span').html(ws.l.not+':<br>'+lText);
					ws.g.isAnimating = false;					
					ws.prevNext(id);
				}
			});
		};

		// NEW FEATURE v2.0 Saving custom location (from search field) 

		ws.setSearchCookie = function(c_name,value,exdays){
			var exdate=new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
			document.cookie=c_name + "=" + c_value;			
		};

		// Parsing weather data

		ws.parseData = function(wData,id,lname){
			
			// Getting location 

			var location = lname;			

			// Getting local time

			var hours = parseFloat(wData.time.split(':')[0]);
			var minutes = wData.time.split(':')[1];

			var ampm = '';

			// BUGFIX v2.2 fixed 12 hour time format

			if( ws.o.timeFormat == 12 ){

				ampm = ws.l.am;

				if( hours > 11 ){
					ampm = ws.l.pm;
				}
		
				if( hours > 12 ){
					hours-=12;
				}else if( hours == 0 ){
					hours = 12;					
				}
			}

			// Setting current measurement

			var m = ws.g.m[ws.o.measurement];

			// Calculating measurement units

			var curtemp = wData.current_condition.temperature[ws.o.measurement];
			var tempmax = wData.forecast[0].temperature.high[ws.o.measurement];
			var tempmin = wData.forecast[0].temperature.low[ws.o.measurement];

			var wspeed = wData.current_condition.wind.speed[ws.o.measurement];
			var vis = wData.current_condition.visibility[ws.o.measurement];
			var prec = wData.current_condition.precipitation[ws.o.measurement];

			var wCondition = wData.current_condition.weather.condition;

			// NEW FEATURE v2.0 Option to hide weather data
			
			var dn = ' style="display: none"';

			// Current Weather

			var dLoc = ws.o.showLoc ? '' : dn;
			var dTime = ws.o.showTime ? '' : dn;
			var dLocTim = ( dLoc == dTime == dn ) ? dn : '';

			var dCond = ws.o.showCond ? '' : dn;
			var dTemp = ws.o.showTemp ? '' : dn;
			var dCondTemp = ( dCond == dTemp == dn ) ? dn : '';

			var dLow = ws.o.showLow ? '' : dn;
			var dHigh = ws.o.showHigh ? '' : dn;
			var dHum = ws.o.showHum ? '' : dn;
			var dLowHighHum = ( dLow == dHigh == dHum == dn ) ? dn : '';

			var dPrec = ws.o.showPrec ? '' : dn;
			var dWind = ws.o.showWind ? '' : dn;
			var dPrecWind = ( dPrec == dWind == dn ) ? dn : '';

			var dPress = ws.o.showPress ? '' : dn;
			var dVis = ws.o.showVis ? '' : dn;
			var dPressVis = ( dPress == dVis == dn ) ? dn : '';

			// Forecast

			var dFDay = ws.o.showFDay ? '' : dn;
			var dFCond = ws.o.showFCond ? '' : dn;

			var dFLow = ws.o.showFLow ? '' : dn;
			var dFHigh = ws.o.showFHigh ? '' : dn;
			var dFLowHigh = ( dFLow == dFHigh == dn  ) ? dn : '';

			// Local weather HTML markup

			var iDataA = '<div class="ws-whead">';
			iDataA += '<p class="ws-weather">'+curtemp+'°'+m.t+'</p>';
			iDataA += '<p class="ws-condition">'+wCondition+'</p>';
			iDataA += '</div>';
			var iData = '<div class="ws-bg"></div>';
			iData += '<h1>'+location+' <span>'+hours+':'+minutes+'</span></h1>';
			iData += '<p class="ws-line temperatura">'+ws.l.ht+': '+tempmax+' °'+m.t+' &middot; '+ws.l.lt+': '+tempmin+' °'+m.t+'</p>';
			iData += '<p class="ws-line">'+ws.l.hu+': '+wData.current_condition.humidity+'% &middot; '+prec+' '+m.pr+' &middot; '+ws.l.wi+': '+wData.current_condition.wind.direction+' &middot; '+wspeed+' '+m.s+'</p>';

			// 3 days forecast

			var daysOfWeek = (ws.l.day+','+ws.l.day).split(',');

			iData +='<div class="ws-forecast"><div class="ws-finner">';

			for(var ii=1;ii<3;ii++){
				tempmax = wData.forecast[ii].temperature.high[ws.o.measurement];
				tempmin = wData.forecast[ii].temperature.low[ws.o.measurement];
				iData += '<div class="ws-mitad"><p class="ws-line ws-fline">'+daysOfWeek[wData.day+ii]+'</p>';
				iData += '<p class="ws-line">'+wData.forecast[ii].weather.condition+'</p>';
				iData += '<p class="ws-line">'+ws.l.ht+': '+tempmax+'°'+m.t+'<br>'+ws.l.lt+': '+tempmin+'°'+m.t+'</p></div>';
			}

			iData +='<br></div></div>';

			$(iDataA).prependTo( $(el).find('.ws-infobox') );
			$(iData).appendTo( $(el).find('.ws-iinner') );

			// Setting up wind

			if( ws.o.wind == true ){
				ws.g.windy = parseInt( wData.current_condition.wind.speed.metric ) > ws.o.windyWeather ? true : false;
			}else{
				ws.g.windy = false;
			}

			if( ws.o.forcewindy ){
				ws.g.windy = ws.o.forcewindy;
			}

			if( ws.o.windDirection == 'left' ){
				ws.g.winDir = -1;
			}else if( ws.o.windDirection == 'right' ){
				ws.g.winDir = 1;
			}else if( ws.o.windDirection == 'auto' ){
				if( wData.current_condition.wind.direction.indexOf('W') != -1 ){
					ws.g.winDir = -1;								
				}else{
					ws.g.winDir = 1;								
				}
			}

			// Hiding loading text

			$(el).find('.ws-loading').fadeOut(750);

			// Loading graphic elements

			ws.makeWeather( wData['current_condition']['weather']['code'], wData['current_condition']['daytime'], wData['current_condition']['temperature']['metric'] );

			// Adding names of previous and next locations, if available

			ws.prevNext(id);
		};

		// Calculating prev and next, changing navigation text

		ws.prevNext = function(id){

			ws.g.curID = id;

			if( ws.g.locations.length > 1 ){

				var prev = id > 0 ? id - 1 : ws.g.locations.length - 1;
				var next = id < ws.g.locations.length - 1 ? id + 1 : 0;
				
				var ptext = ws.g.locations[prev].split(',')[0].indexOf('GEOLOCATION') != -1 ? ws.g.curLocation.split(',')[0] +' (' + ws.l.cl + ')' : ws.g.locations[prev];
				var ntext = ws.g.locations[next].split(',')[0].indexOf('GEOLOCATION') != -1 ? ws.g.curLocation.split(',')[0] +' (' + ws.l.cl + ')' : ws.g.locations[next];

				// NEW FEATURE v2.1 Custom Location Name

				$(el).find('.ws-location').each(function(){
					if( ptext == $(this).html() && $(this).attr('title') ){
						ptext = $(this).attr('title');
					};
					if( ntext == $(this).html() && $(this).attr('title') ){
						ntext = $(this).attr('title');
					};
				});
				
				ptext = ptext.split(',')[0];
				ntext = ntext.split(',')[0];
				
				$(el).find('.ws-prev-text').html(ptext);
				$(el).find('.ws-next-text').html(ntext);

				$(el).find('.ws-prev-arrow, .ws-next-arrow').unbind('click');
				$(el).find('.ws-prev-arrow').click(function(e){
					e.preventDefault();
					$(this).mouseleave();
					$(el).weatherSlider(prev);
				});
				$(el).find('.ws-next-arrow').click(function(e){
					e.preventDefault();
					$(this).mouseleave();
					$(el).weatherSlider(next);
				});

				if( !ws.g.oldIE ){
					$(el).find('.ws-nav').delay(1000).fadeIn(500);
				}else{
					$(el).find('.ws-nav').delay(1000).fadeIn(1);					
				}
			}
			
			if( ws.o.slideDelay > 0 ){

				if( ws.g.slideTimer ){
					clearTimeout( ws.g.slideTimer );
				}
				ws.g.slideTimer = setTimeout( function(){
					$(el).find('.ws-next-arrow').click();
				}, 1500 + ws.o.slideDelay );				
			}else if( ws.o.refreshInterval > 0 ){
				
				if( ws.g.slideTimer ){
					clearTimeout( ws.g.slideTimer );
				}
				ws.g.slideTimer = setTimeout( function(){
					ws.change( ws.g.curID );
				}, 1500 + ws.o.refreshInterval );				
			}
		};

		ws.makeWeather = function( weather_code, daytime, curtemp ){

			if( ws.o.forcewcode ){
				weather_code = ws.o.forcewcode;
			}
			if( ws.o.forcedaytime ){
				daytime = ws.o.forcedaytime;
			}
			if( ws.o.forcecurtemp ){
				curtemp = ws.o.forcecurtemp;
			}

			// Switching weather by weather_code

			switch( parseInt(weather_code) ){

				// Sunny or Clear (at night)

				case 113:

					switch(daytime){
						case 'day':
							ws.create('clear_day');
							ws.create('sun');
						break;
						case 'night':
							ws.create('clear_night');
							ws.create('moon');
						break;
					}

				break;

				// Partly Cloudy

				case 116:

					switch(daytime){
						case 'day':
							ws.create('white_cloudy_day');
							ws.create('white_cloud_day_1');
							ws.create('white_cloud_day_2');
							ws.create('white_cloud_day_3');
							ws.create('white_cloud_day_4');
							ws.create('sun');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('moon');
						break;
					}

				break;

				// Cloudy

				case 119:

					switch(daytime){
						case 'day':
							ws.create('grey_cloudy_day');
							ws.create('grey_cloud_day_1');
							ws.create('grey_cloud_day_2');
							ws.create('grey_cloud_day_3');
							ws.create('grey_cloud_day_4');
							ws.create('sun');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('moon');
						break;
					}

				break;

				// Overcast

				case 122:

					switch(daytime){
						case 'day':
							ws.create('dark_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
						break;
					}

				break;

				// Freezing fog

				case 260:

				// Fog

				case 248:

				// Mist

				case 143:

					switch(daytime){
						case 'day':
							ws.create('foggy_day');
							ws.create('fog_day');
						break;
						case 'night':
							ws.create('foggy_night');
							ws.create('fog_night');
						break;
					}

				break;

				// Patchy light rain in area with thunder

				case 386:

					ws.create('lightning1');
					ws.create('lightning2');
					ws.create('lightning3');
					ws.create('lightning4');
					
				// Light drizzle

				case 266:

				// Patchy light drizzle

				case 263:

				// Light rain

				case 296:

				// Patchy rain nearby

				case 176:

				// Patchy light rain

				case 293:

				// Light rain shower

				case 353:

					switch(daytime){
						case 'day':
							ws.create('grey_cloudy_day');
							ws.create('grey_cloud_day_1');
							ws.create('grey_cloud_day_2');
							ws.create('grey_cloud_day_3');
							ws.create('grey_cloud_day_4');
							ws.create('rain_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('rain_night');
						break;
					}

					ws.create('raindrops');

				break;

				// Moderate rain

				case 302:

				// Moderate rain at times

				case 299:

				// Moderate or heavy rain shower

				case 356:

					switch(daytime){

						case 'day':
							ws.create('grey_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
							ws.create('rain_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('rain_night');
						break;
					}

					ws.create('raindrops');

				break;

				// Moderate or heavy rain in area with thunder

				case 389:

				// Thundery outbreaks in nearby

				case 200:

					switch(daytime){
						case 'day':
							ws.create('dark_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
							ws.create('rain_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('rain_night');
						break;
					}

					ws.create('lightning1');
					ws.create('lightning2');
					ws.create('lightning3');
					ws.create('lightning4');

					ws.create('raindrops');

				break;

				// Heavy rain

				case 308:

				// Heavy rain at times

				case 305:
				
				// Torrential rain shower

				case 359:					

					switch(daytime){
						case 'day':
							ws.create('dark_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
							ws.create('rain_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('rain_night');
						break;
					}

					ws.create('raindrops');

				break;

				// Patchy light snow in area with thunder

				case 392:

				// Light sleet

				case 317:

				// Patchy sleet nearby

				case 182:

				// Light freezing rain

				case 311:

				// Light sleet showers

				case 362:

				// Freezing drizzle

				case 281:

				// Light showers of ice pellets

				case 374:

				// Ice pellets

				case 350:

				// Patchy freezing drizzle nearby

				case 185:

					switch(daytime){
						case 'day':
							ws.create('grey_cloudy_day');
							ws.create('grey_cloud_day_1');
							ws.create('grey_cloud_day_2');
							ws.create('grey_cloud_day_3');
							ws.create('grey_cloud_day_4');
							ws.create('rain_day');
							ws.create('snow_big_day');
							ws.create('snow_small_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('rain_night');
							ws.create('snow_big_night');
							ws.create('snow_small_night');
						break;
					}

					ws.create('raindrops');

				break;

				// Moderate or Heavy freezing rain

				case 314:

				// Moderate or heavy sleet

				case 320:

				// Moderate or heavy sleet showers

				case 365:

				// Moderate or heavy showers of ice pellets

				case 377:

				// Moderate or heavy snow in area with thunder

				case 395:

				// Heavy freezing drizzle

				case 284:

					switch(daytime){
						case 'day':
							ws.create('dark_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
							ws.create('rain_day');
							ws.create('snow_big_day');
							ws.create('snow_small_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('rain_night');
							ws.create('snow_big_night');
							ws.create('snow_small_night');
						break;
					}

					ws.create('raindrops');

				break;
			
				// Patchy light snow

				case 323:

				// Light snow

				case 326:

				// Light snow showers

				case 368:

				// Patchy snow nearby

				case 179:

					switch(daytime){
						case 'day':
							ws.create('grey_cloudy_day');
							ws.create('grey_cloud_day_1');
							ws.create('grey_cloud_day_2');
							ws.create('grey_cloud_day_3');
							ws.create('grey_cloud_day_4');
							ws.create('snow_big_day');
							ws.create('snow_small_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('snow_big_night');
							ws.create('snow_small_night');
						break;
					}

				break;
			
				// Patchy moderate snow

				case 329:

				// Moderate snow

				case 332:

				// Patchy heavy snow

				case 335:

				// Heavy snow

				case 338:

					switch(daytime){
						case 'day':
							ws.create('grey_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
							ws.create('snow_big_day');
							ws.create('snow_small_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('snow_big_night');
							ws.create('snow_small_night');
						break;
					}

				break;

				// Moderate or heavy snow showers

				case 371:

				// Blowing snow

				case 227:

				// Blizzard

				case 230:

					switch(daytime){
						case 'day':
							ws.create('dark_cloudy_day');
							ws.create('dark_cloud_day_1');
							ws.create('dark_cloud_day_2');
							ws.create('dark_cloud_day_3');
							ws.create('dark_cloud_day_4');
							ws.create('snow_big_day');
							ws.create('snow_small_day');
						break;
						case 'night':
							ws.create('starry_sky');
							ws.create('cloudy_night');
							ws.create('dark_cloud_night_1');
							ws.create('dark_cloud_night_2');
							ws.create('dark_cloud_night_3');
							ws.create('dark_cloud_night_4');
							ws.create('snow_big_night');
							ws.create('snow_small_night');
						break;
					}

				break;
			}

			// Creating icy, if need

			if( curtemp < ws.o.icyTemp ){
				switch(daytime){
					case 'day':
						ws.create('icy_day_left');
						ws.create('icy_day_right');
					break;
					case 'night':
						ws.create('icy_night_left');
						ws.create('icy_night_right');
					break;
				}				
			}

			// Animating infobox

			ws.animateIn( $(el).find('.ws-infobox') );

		};

		// Creating elements

		ws.create = function( what ){

			if( ws.w[what] ){

				if( ws.w[what].where ){
					var where = $(el).find(ws.w[what].where);
				}else{
					var where = $(el);
				}

				// If element is a background-layer

				if( ws.w[what].type == 'bg' ){

					if( !ws.o.hideBackground ){
						
						$('<img>').load(function(){

							var ob = $('<div>').appendTo(where).addClass(ws.w[what].classNames).css({
								backgroundImage : 'url('+ws.o.imgPath+ws.w[what].fileName+')'
							});						

							// Animating element

							ws.animateIn(ob,what);

						}).attr('src',ws.o.imgPath+ws.w[what].fileName);
					}

				// If element is an image-layer

				}else{	
					
					var ob = $('<img>').css('visibility','hidden').appendTo(where).unbind().bind('load',function(){

						$(this).addClass(ws.w[what].classNames).css({
							height : $(this).height() * ws.o.reduction,
							marginLeft : (parseInt($(this).css('margin-left'))-ws.w[what].mL)  * ws.o.reduction,
							marginTop : (parseInt($(this).css('margin-top'))-ws.w[what].mT) * ws.o.reduction,
							visibility : 'visible'
						});

						if( !ws.g.oldIE && !$(this).hasClass('ws-lightnings') ){
							$(this).css({
								opacity : 0
							});
						}

						// Animating element

						ws.animateIn(ob,what);
						
					}).attr('src',ws.o.imgPath+ws.w[what]['fileName']+'?'+(Math.random()*1000000));
				}					
			}
		};

		// Animating in, choosing animation type (CSS or JS) for wind (background), rain, and snow

		ws.animateIn = function(ob,what){

			// NEW FEATURE v2.1 Transparent Background

			if( ws.o.hideBackground ){
				setTimeout( function(){
					ws.g.isAnimating = false;
				}, 1500);
			}

			// Animating background

			if( ob.hasClass('ws-fullbg') ){

				// Fading in (independent from animation settings)

				ob.css({
					backgroundPosition : '0px ' + ws.g.bgPosY + 'px'
				}).fadeIn(1500,function(){
					ws.g.isAnimating = false;
				});

				// Animate only if weather is windy

				if( ws.g.windy && !ob.hasClass('ws-fixed') ){

					if( ws.o.CSSanimations && ws.g.css3 ){

						ob.addClass('ws-fullbg-animating');							
					}else if( ws.o.JSanimations ){
						
						ws.animateJS(ob,'ws-fullbg');
					}
				}

			// Animating special background at bottom

			}else if( ob.hasClass('ws-bottombg') ){

				ob.animate({
					marginBottom : 0
				}, 1000, 'easeOutQuad');					

				if( ws.g.windy ){

					if( ws.o.CSSanimations && ws.g.css3 ){

						ob.addClass('ws-bottombg-animating');

					}else if( ws.o.JSanimations ){

						ws.animateJS(ob,'ws-bottombg');
					}
				}

			// Animating rain

			}else if( ob.hasClass('ws-rain') ){

				if( !ws.g.oldIE ){
					ob.dequeue().delay(1000).animate({
						opacity : 1
					}, 4000, 'easeOutQuad');
				}

				if( ws.o.rain ){

					if( ws.o.CSSanimations && ws.g.css3 ){

						ob.addClass('ws-rain-animating');

					}else if( ws.o.JSanimations ){

						ws.animateJS(ob,'ws-rain');
					}
				}

			// Animating snow

			}else if( ob.hasClass('ws-snow') ){

				if( !ws.g.oldIE ){
					ob.dequeue().delay(1000).animate({
						opacity : 1
					}, 4000, 'easeOutQuad');
				}
				
				if( ws.o.snow ){
					
					if( ws.o.CSSanimations && ws.g.css3 ){

						if( ob.hasClass('ws-snow-big') ){
							ob.addClass('ws-snowbig-animating');
						}else if( ob.hasClass('ws-snow-small') ){
							ob.addClass('ws-snowsmall-animating');
						}

					}else if( ws.o.JSanimations ){

						if( ob.hasClass('ws-snow-big') ){
							ws.animateJS(ob,'ws-snow-big');
						}else if( ob.hasClass('ws-snow-small') ){
							ws.animateJS(ob,'ws-snow-small');
						}
					}
				}

			// Animating clouds, fog, icy, the Sun and the Moon

			}else if( ob.hasClass('ws-clouds') || ob.hasClass('ws-sunmoon') || ob.hasClass('ws-fog') || ob.hasClass('ws-icy') ){

				if( !ws.g.oldIE ){
					ob.animate({
						opacity : 1,
						marginLeft : '+='+ws.w[what].mL * ws.o.reduction,
						marginTop : '+='+ws.w[what].mT * ws.o.reduction
					}, 2000, 'easeInOutQuint');
				}else{
					ob.animate({
						marginLeft : '+='+ws.w[what].mL * ws.o.reduction,
						marginTop : '+='+ws.w[what].mT * ws.o.reduction
					}, 2000, 'easeOutQuint');
				}

			// Animating lightnings

			}else if( ob.hasClass('ws-lightnings') && ws.o.lightnings ){

				// Lightnings are animated only with JS

				if( ws.o.CSSanimations || ws.o.JSanimations ){						

					if( ob.hasClass('ws-lightning1') ){							
						ws.animateJS(ob,'ws-lightning1');
					}else if( ob.hasClass('ws-lightning2') ){
						ws.animateJS(ob,'ws-lightning2');
					}else if( ob.hasClass('ws-lightning3') ){
						ws.animateJS(ob,'ws-lightning3');
					}else if( ob.hasClass('ws-lightning4') ){
						ws.animateJS(ob,'ws-lightning4');
					}

				}else{
					
					// If animations are both off, showing .ws-lightning2 constantly

					$(el).find('.ws-lightning2').css('display','block');
				}

			// Animating weather information box

			}else if( ob.hasClass('ws-infobox') ){
				
				// Automatically reducing font-sizes and paddings in .ws-infobox if required
				
				// var tempWidth = ws.g.sliderWidth;
				// var tempRatio = ws.g.sliderWidth / ws.g.sliderHeight;
				// if( tempRatio > 1.5 ){
				// 	tempWidth = ws.g.sliderHeight * 1.5;
				// };
				
				// if( tempWidth < 500 ){

				// 	ob.find('h1, h1 span, .ws-weather, .ws-line').each(function(){

				// 		// Saving original styles on first load

				// 		var fontSize = parseInt( $(this).css('font-size') );
						
				// 		if( !$(this).data('ws-fontSize') ){
				// 			$(this).data('ws-fontSize', fontSize );
				// 		}else{
				// 			fontSize = $(this).data('ws-fontSize');
				// 		}

				// 		var fs = parseInt( fontSize / 500 * tempWidth );
				// 		fs = fs < 11 ? 11 : fs;

				// 		$(this).css({
				// 			fontSize : fs + 'px'
				// 		});
				// 	});

				// 	var paddingLeft = parseInt(ob.css('padding-left') );
					
				// 	if( !ob.data('ws-paddingLeft') ){
				// 		ob.data('ws-paddingLeft', paddingLeft );						
				// 	}else{
				// 		paddingLeft = ob.data('ws-paddingLeft');
				// 	}
					
				// 	var pl = parseInt( paddingLeft / 500 * tempWidth );
				// 	pl = pl < 7 ? 7 : pl;

				// 	var bottom = parseInt(ob.css('bottom') );
					
				// 	if( !ob.data('bottom') ){
				// 		ob.data('bottom', bottom );						
				// 	}else{
				// 		bottom = ob.data('bottom');
				// 	}

				// 	var b = parseInt( bottom / 500 * tempWidth );
				// 	b = b < 5 ? 5 : b;

				// 	ob.css({
				// 		padding : pl,
				// 		bottom : b
				// 	});

				// 	var paddingBottom = parseInt(ob.find('h1').css('padding-bottom') );
					
				// 	if( !ob.find('h1').data('ws-paddingBottom') ){
				// 		ob.find('h1').data('ws-paddingBottom', paddingBottom );
				// 	}else{
				// 		paddingBottom = ob.find('h1').data('ws-paddingBottom');
				// 	}
				// 	pb = parseInt( paddingBottom / 500 * tempWidth );
				// 	pb = pb < 1 ? 1 : pb;

				// 	ob.find('h1').css('padding-bottom',pb);
				// }

				// // If some texts in infobox are too wide...

				// if( ob.width() > ws.g.sliderWidth - 20 ){
				// 	ob.find('p').css({
				// 		width : ws.g.sliderWidth * .9
				// 	});
				// 	ob.find('*').css({
				// 		whiteSpace : 'normal'
				// 	});
				// }

				// Animating infobox

				ob.css({
					marginLeft : - ob.outerWidth() / 2,
					marginBottom : -ob.outerHeight() - 20
				}).delay(500).animate({
					marginBottom : 0
				}, ws.o.infoDuration, ws.o.infoEasingType[0], function(){
					
					if( ws.o.alwaysShowForecast ){

						$(el).find('.ws-forecast').stop().animate({
							height: $(this).find('.ws-finner').innerHeight()
						}, 400, 'easeInOutQuad');						
					}
				});
			}else if( ob.hasClass('ws-searchbox') ){

				ob.css({
					height: ws.g.sliderWidth / 36 + 15
				});
				
				ob.find('input').each(function(){

					var fs = parseInt( parseInt( $(this).css('font-size') ) / 500 * ws.g.sliderWidth );
					fs = fs < 11 ? 11 : fs;

					$(this).css({
						fontSize : fs + 'px',
						lineHeight : $(this).height() + 'px'
					});
				});				
			}
		};

		ws.getRand = function(){

			return (Math.floor(Math.random() * 10) + 5) * 1000;
		};

		// Animating with JS

		ws.animateJS = function(ob,className){

			switch(className){

				case 'ws-fullbg':

					var bg1 = function(){
						ob.dequeue().animate({
							backgroundPosition: (ws.g.winDir * 1300)+'px ' + ws.g.bgPosY + 'px'
						},100000,'linear',function(){
							$(this).css({
								backgroundPosition: '0 '+( ( ws.g.sliderHeight - 600 ) / 2 )
							});
							bg1();
						});	
					}
					bg1();

				break;
				
				case 'ws-bottombg':

					var bg2 = function(){
						ob.dequeue().animate({
							backgroundPosition: (ws.g.winDir * 1137)+'px 0px'
						},200000,'linear',function(){
							$(this).css({
								backgroundPosition: '0 0'
							});
							bg2();
						});	
					}
					bg2();

				break;

				case 'ws-rain':

					var r = function(){
						ob.dequeue().animate({
							backgroundPosition: '0 200'
						},1000,'linear',function(){
							ob.css({
								backgroundPosition: '0 0'
							});
							r();
						});	
					}

					r();

				break;

				case 'ws-snow-small':

					var s1 = function(){
						ob.dequeue().animate({
							backgroundPosition: '0 200'
						},3000,'linear',function(){
							ob.css({
								backgroundPosition: '0 0'
							});
							s1();
						});	
					}
					s1();

				break;

				case 'ws-snow-big':

					var s2 = function(){
						ob.dequeue().animate({
							backgroundPosition: '0 200'
						},5000,'linear',function(){
							ob.css({
								backgroundPosition: '0 0'
							});
							s2();
						});	
					}
					s2();

				break;

				case 'ws-lightning1':

					var l1 = function(){
						if( !ws.g.oldIE ){
							ob.delay( ws.getRand() ).fadeIn(1).fadeOut(250, function(){
								l1();
							});									
						}else{
							ob.delay( ws.getRand() ).fadeIn(0).delay(100).fadeOut(0, function(){
								l1();
							});																		
						}
					}
					l1();

				break;

				case 'ws-lightning2':

					var l2 = function(){
						if( !ws.g.oldIE ){
							ob.delay( ws.getRand() ).fadeIn(1).fadeOut(250, function(){
								l2();
							});									
						}else{
							ob.delay( ws.getRand() ).fadeIn(0).delay(100).fadeOut(0, function(){
								l2();
							});																		
						}
					}
					l2();

				break;

				case 'ws-lightning3':

					var l3 = function(){
						if( !ws.g.oldIE ){
							ob.delay( ws.getRand() ).fadeIn(30).fadeOut(30).fadeIn(30).fadeOut(30).fadeIn(30).fadeOut(250, function(){
								l3();
							});									
						}else{
							ob.delay( ws.getRand() ).fadeIn(0).delay(30).fadeOut(0).delay(30).fadeIn(0).delay(30).fadeOut(0).delay(30).fadeIn(0).delay(100).fadeOut(0, function(){
								l3();
							});																		
						}
					}
					l3();

				break;

				case 'ws-lightning4':

					var l4 = function(){
						if( !ws.g.oldIE ){
							ob.delay( ws.getRand() ).fadeIn(30).fadeOut(30).fadeIn(30).fadeOut(30).fadeIn(30).fadeOut(250, function(){
								l4();
							});									
						}else{
							ob.delay( ws.getRand() ).fadeIn(0).delay(30).fadeOut(0).delay(30).fadeIn(0).delay(30).fadeOut(0).delay(30).fadeIn(0).delay(100).fadeOut(0, function(){
								l4();
							});																		
						}
					}
					l4();

				break;
			}
			
		};

		// Triggering initialization

		ws.init();
	};
	
	$.weatherSlider.weatherTypes = {

		// Backgrounds

		clear_day			: {
			type			: 'bg',
			fileName		: 'clear_day.jpg',
			classNames		: 'ws-fullbg'
		},
		foggy_day	: {
			type			: 'bg',
			fileName		: 'foggy_day.jpg',
			classNames		: 'ws-fullbg ws-fixed'
		},
		white_cloudy_day	: {
			type			: 'bg',
			fileName		: 'white_cloudy_day.jpg',
			classNames		: 'ws-fullbg'
		},
		grey_cloudy_day		: {
			type			: 'bg',
			fileName		: 'grey_cloudy_day.jpg',
			classNames		: 'ws-fullbg'
		},
		dark_cloudy_day		: {
			type			: 'bg',
			fileName		: 'dark_cloudy_day.jpg',
			classNames		: 'ws-fullbg'
		},

		clear_night			: {
			type			: 'bg',
			fileName		: 'clear_night.jpg',
			classNames		: 'ws-fullbg ws-fixed'
		},
		foggy_night	: {
			type			: 'bg',
			fileName		: 'foggy_night.jpg',
			classNames		: 'ws-fullbg ws-fixed'
		},
		cloudy_night		: {
			type			: 'bg',
			fileName		: 'cloudy_night.png',
			classNames		: 'ws-fullbg'
		},
		starry_sky			: {
			type			: 'bg',
			fileName		: 'starry_sky.jpg',
			classNames		: 'ws-fullbg ws-fixed'
		},

		// Sun and Moon

		sun					: {
			fileName		: 'sun.png',
			classNames		: 'ws-sunmoon',
			mL				: 0,
			mT				: 50
		},

		moon				: {
			fileName		: 'moon.png',
			classNames		: 'ws-sunmoon',
			mL				: 0,
			mT				: 50
		},

		// Clouds and Fog / Mist

		white_cloud_day_1	: {
			fileName		: 'white_cloud_day_1.png',
			classNames		: 'ws-cloud1 ws-clouds',
			mL				: -50,
			mT				: -50
		},
		white_cloud_day_2	: {
			fileName		: 'white_cloud_day_2.png',
			classNames		: 'ws-cloud2 ws-clouds',
			mL				: 150,
			mT				: -75
		},
		white_cloud_day_3	: {
			fileName		: 'white_cloud_day_3.png',
			classNames		: 'ws-cloud3 ws-clouds',
			mL				: -150,
			mT				: -75
		},
		white_cloud_day_4	: {
			fileName		: 'white_cloud_day_4.png',
			classNames		: 'ws-cloud4 ws-clouds',
			mL				: 50,
			mT				: -50
		},

		grey_cloud_day_1	: {
			fileName		: 'grey_cloud_day_1.png',
			classNames		: 'ws-cloud1 ws-clouds',
			mL				: -50,
			mT				: -50
		},
		grey_cloud_day_2	: {
			fileName		: 'grey_cloud_day_2.png',
			classNames		: 'ws-cloud2 ws-clouds',
			mL				: 150,
			mT				: -75
		},
		grey_cloud_day_3	: {
			fileName		: 'grey_cloud_day_3.png',
			classNames		: 'ws-cloud3 ws-clouds',
			mL				: -150,
			mT				: -75
		},
		grey_cloud_day_4	: {
			fileName		: 'grey_cloud_day_4.png',
			classNames		: 'ws-cloud4 ws-clouds',
			mL				: 50,
			mT				: -50
		},

		dark_cloud_day_1	: {
			fileName		: 'dark_cloud_day_1.png',
			classNames		: 'ws-cloud1 ws-clouds',
			mL				: -50,
			mT				: -50
		},
		dark_cloud_day_2	: {
			fileName		: 'dark_cloud_day_2.png',
			classNames		: 'ws-cloud2 ws-clouds',
			mL				: 150,
			mT				: -75
		},
		dark_cloud_day_3	: {
			fileName		: 'dark_cloud_day_3.png',
			classNames		: 'ws-cloud3 ws-clouds',
			mL				: -150,
			mT				: -75
		},
		dark_cloud_day_4	: {
			fileName		: 'dark_cloud_day_4.png',
			classNames		: 'ws-cloud4 ws-clouds',
			mL				: 50,
			mT				: -50
		},

		dark_cloud_night_1	: {
			fileName		: 'dark_cloud_night_1.png',
			classNames		: 'ws-cloud1 ws-clouds',
			mL				: -50,
			mT				: -50
		},
		dark_cloud_night_2	: {
			fileName		: 'dark_cloud_night_2.png',
			classNames		: 'ws-cloud2 ws-clouds',
			mL				: 150,
			mT				: -75
		},
		dark_cloud_night_3	: {
			fileName		: 'dark_cloud_night_3.png',
			classNames		: 'ws-cloud3 ws-clouds',
			mL				: -150,
			mT				: -75
		},
		dark_cloud_night_4	: {
			fileName		: 'dark_cloud_night_4.png',
			classNames		: 'ws-cloud4 ws-clouds',
			mL				: 50,
			mT				: -50
		},

		fog_day	: {
			fileName		: 'fog_day.png',
			classNames		: 'ws-fog',
			mL				: 0,
			mT				: 0
		},
		fog_night	: {
			fileName		: 'fog_night.png',
			classNames		: 'ws-fog',
			mL				: 0,
			mT				: 0
		},

		// Rain and raindrops

		rain_day			: {
			type			: 'bg',
			fileName		: 'rain_day.png',
			classNames		: 'ws-rain' 
		},

		rain_night			: {
			type			: 'bg',
			fileName		: 'rain_night.png',
			classNames		: 'ws-rain' 
		},

		raindrops			: {
			type			: 'bg',
			where			: '.ws-inner',
			fileName		: 'raindrops.png',
			classNames		: 'ws-bottombg' 
		},

		// Snow and icy

		snow_big_day		: {
			type			: 'bg',
			fileName		: 'snow_big_day.png',
			classNames		: 'ws-snow ws-snow-big' 
		},
		snow_small_day		: {
			type			: 'bg',
			fileName		: 'snow_small_day.png',
			classNames		: 'ws-snow ws-snow-small' 
		},
		
		snow_big_night		: {
			type			: 'bg',
			fileName		: 'snow_big_night.png',
			classNames		: 'ws-snow ws-snow-big' 
		},
		snow_small_night	: {
			type			: 'bg',
			fileName		: 'snow_small_night.png',
			classNames		: 'ws-snow ws-snow-small' 
		},

		icy_day_left		: {
			fileName		: 'icy_day_left.png',
			classNames		: 'ws-icy ws-icy-left',
			mL				: 0,
			mT				: 0
		},
		icy_day_right		: {
			fileName		: 'icy_day_right.png',
			classNames		: 'ws-icy ws-icy-right',
			mL				: 0,
			mT				: 0
		},

		icy_night_left		: {
			fileName		: 'icy_night_left.png',
			classNames		: 'ws-icy ws-icy-left',
			mL				: 0,
			mT				: 0
		},
		icy_night_right		: {
			fileName		: 'icy_night_right.png',
			classNames		: 'ws-icy ws-icy-right',
			mL				: 0,
			mT				: 0
		},

		// Lightnings

		lightning1			: {
			fileName		: 'lightning1.png',
			classNames		: 'ws-lightning1 ws-lightnings',
			mL				: 0,
			mT				: 0
		},
		lightning2			: {
			fileName		: 'lightning2.png',
			classNames		: 'ws-lightning2 ws-lightnings',
			mL				: 0,
			mT				: 0
		},
		lightning3			: {
			fileName		: 'lightning3.png',
			classNames		: 'ws-lightning3 ws-lightnings',
			mL				: 0,
			mT				: 0
		},
		lightning4			: {
			fileName		: 'lightning4.png',
			classNames		: 'ws-lightning4 ws-lightnings',
			mL				: 0,
			mT				: 0
		}
	};

	// FIX v2.2 replacing $.browser function (removed from jQuery 1.9)

	var wsBrowser = function(){

		uaMatch = function( ua ) {
			ua = ua.toLowerCase();

			var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
				/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
				/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
				/(msie) ([\w.]+)/.exec( ua ) ||
				ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
				[];

			return {
				browser: match[ 1 ] || "",
				version: match[ 2 ] || "0"
			};
		};

		var matched = uaMatch( navigator.userAgent ), browser = {};

		if ( matched.browser ) {
			browser[ matched.browser ] = true;
			browser.version = matched.version;
		}

		if ( browser.chrome ) {
			browser.webkit = true;
		} else if ( browser.webkit ) {
			browser.safari = true;
		}
		return browser;			
	};

	$.weatherSlider.global = {
		
		// global settings (Do not change these settings!)

		version			: '2.3.0',
		curID			: 0,
		oldIE			: wsBrowser().msie && wsBrowser().version < 9 ? true : false,
		css3			: wsBrowser().webkit || wsBrowser().safari || wsBrowser().mozilla || ( wsBrowser().opera && wsBrowser().version > 11 ) ? true : false,
		m				: {
			metric : {
				t 		: 'C',
				s 		: 'km/h',
				l		: 'km',
				pr		: 'mm',
				p		: 'hPa'
			},
			imperial : {
				t		: 'F',
				s		: 'mph',
				l		: 'mi',
				pr		: 'in',
				p		: 'mb'
			}
		}
	};

	$.weatherSlider.language = {
		
		cl					: 'Ubicación Actual',
		ht					: 'Máxima',
		lt					: 'Mínima',
		hu					: 'Humedad',
		pr					: 'Precipitación',
		wi					: 'Viento',
		ps					: 'Presión',
		vi					: 'Visibilidad',

		get					: 'buscando información del clima',
		not					: 'Ubicación no encontrada',
		una					: 'No fue posible determinar tu ubicación.',
		search				: 'Enter your custom location',
		
		am					: 'AM',
		pm					: 'PM',

		// Days of week (Important: please always start it with Sunday)
		
		day					: 'Domingo,Lunes,Martes,Miércoles,Jueves,Viernes,Sábado',

		// Weather condition names
		
		'113'				: 'Soleado, despejado',
		'114'				: 'Soleado',
		'115'				: 'Despejado',
		'116'				: 'Parcialmente nublado',
		'119'				: 'Nublado',
		'122'				: 'Nublado',
		'143'				: 'Niebla',
		'176'				: 'Lluvia suave',
		'179'				: 'Nieve suave ',
		'182'				: 'Nubes y aguanieve',
		'185'				: 'Nubes y llovizna',
		'200'				: 'Tormenta cercana',
		'227'				: 'Nieve polvo',
		'230'				: 'Ventisca',
		'248'				: 'Niebla',
		'260'				: 'Niebla congelada',
		'263'				: 'Niebla y llovizna',
		'266'				: 'Llovizna Suave',
		'281'				: 'Llovizna',
		'284'				: 'Llovizna congelada',
		'293'				: 'Lluvia moderada',
		'296'				: 'Lluvia suave',
		'299'				: 'Lluvia moderada a ratos',
		'302'				: 'Lluvia moderada',
		'305'				: 'Lluvia fuerte a ratos',
		'308'				: 'Lluvia fuerte',
		'311'				: 'Lluvia helada suave',
		'314'				: 'Lluvia helada moderada',
		'317'				: 'Aguanieve',
		'320'				: 'Aguanieve moderada',
		'323'				: 'Nieve moderada',
		'326'				: 'Nieve suave',
		'329'				: 'Nubes y nieve moderada',
		'332'				: 'Nieve moderada',
		'335'				: 'Nubes y nieve',
		'338'				: 'Fuerte nevada',
		'350'				: 'Hielo',
		'353'				: 'Lluvia ligera',
		'356'				: 'Lluvia moderada',
		'359'				: 'Lluvia torrencial',
		'362'				: 'Chubascos de aguanieve',
		'365'				: 'Chubascos de aguanieve moderada',
		'368'				: 'Nieve ligera',
		'371'				: 'Moderate or heavy snow showers',
		'374'				: 'Light showers of ice pellets',
		'377'				: 'Moderate or heavy showers of ice pellets',
		'386'				: 'Patchy light rain in area with thunder',
		'389'				: 'Moderate or heavy rain in area with thunder',
		'392'				: 'Patchy light snow in area with thunder',
		'395'				: 'Moderate or heavy snow in area with thunder'		
	};

	$.weatherSlider.options = {
		
		// User settings (can be modified)

		imgPath				: '../weatherslider/img/',

		CSSanimations		: true,
		JSanimations		: true,
		snow				: true,
		rain				: true,
		wind				: true,
		lightnings			: true,

		windyWeather		: 18,
		windDirection		: 'auto',
		icyTemp				: -2,

		measurement			: 'metric',
		daytime				: [7,19],

		infoDuration		: 450,
		infoEasingType		: ['easeOutBack','easeInBack'],

		reduction			: 'auto',
		keybNav				: true,
		touchNav			: true,
		
		// NEW FEATURES v2.0

		responsive			: true,
		enableSearchField	: false,
		enableWeatherInfo	: true,
		enableForecast		: true,
		slideDelay			: 0,
		refreshInterval		: 0,
		timeFormat			: 12,

		// Show or hide current weather data
		
		showLoc				: true,
		showTime			: true,
		showCond			: true,
		showTemp			: true,
		showLow				: true,
		showHigh			: true,
		showHum				: true,
		showPrec			: true,
		showWind			: true,
		showPress			: true,
		showVis				: true,

		// Show or hide 3 days forecast weather data

		showFDay			: true,
		showFCond			: true,
		showFLow			: true,
		showFHigh			: true,

		// NEW FEATURES v2.1

		// Show or hide background image

		hideBackground		: false,
		
		// NEW FEATURES v2.2

		alwaysShowForecast	: false,
		alwaysShowSearch	: false,

		// Important! You must sign up to get your own WorlWeatherOnline API key!
		// Please do NOT use our API key, except for testing only!
		// The registraion for your API key is free:
		// http://www.worldweatheronline.com/register.aspx

		WWOAPIKey			: 'wjmn2u36g2j4hecnr6brmm44'
	};

})(jQuery);