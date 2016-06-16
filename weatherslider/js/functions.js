jQuery(function($){

	$('body').dayTimr();

	conditionizr({
		debug      : false,
		scriptSrc  : 'weatherslider/js/conditionizr/',
		styleSrc   : 'weatherslider/css/conditionizr/',
		touch      : { scripts: true, styles: true, classes: true, customScript: false }
	});

});

