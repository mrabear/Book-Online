// The servicesDB object contains the current list of all services, the time in minutes it takes to perform, and the cost
// Format:
// UniqueServiceName - The unique identifer for this service (I use this as the value of the checkbox to make it easier to line up form selections with entries in this DB)
// 		Time - Duration of service (used to calculate total appointment time)
//		Price - total cost of service (used to calculate total appointment cost)
//		Label - The friendly name of this service (used for emails and confirmation page, basically anything that a person will see)
var servicesDB = {
	NPNG: 					{time:60,	price:69,	label:"NPNG Facial"},
	Cleansing: 				{time:60,	price:95,	label:"Cleansing Facial"},
	Hydrating: 				{time:60,	price:95,	label:"Hydrating Facial"},
	Verbena: 				{time:60,	price:89,	label:"Verbena Facial"},
	Brightening: 			{time:60,	price:95,	label:"Brightening Facial"},
	Soothing: 				{time:60,	price:95,	label:"Soothing Facial"},
	Brow: 					{time:15,	price:20,	label:"Brow Wax"},
	Underarm: 				{time:15,	price:20,	label:"Underarm Wax"},
	Lower_Back: 			{time:30,	price:25,	label:"Lower Back Wax"},
	Full_Leg: 				{time:60,	price:80,	label:"Full Leg Wax"},
	Lip: 					{time:15,	price:15,	label:"Lip Wax"},
	Half_Arm: 				{time:30,	price:25,	label:"Half Arm Wax"},
	Bikini: 				{time:30,	price:25,	label:"Bikini Wax"},
	Chest_Men: 				{time:60,	price:55,	label:"Mens Chest Wax"},
	Chin: 					{time:15,	price:15,	label:"Chin Wax"},
	Full_Arm: 				{time:60,	price:50,	label:"Full Arm Wax"},
	Half_Leg: 				{time:30,	price:48,	label:"Half Leg Wax"},
	Back_Men: 				{time:60,	price:55,	label:"Mens Back Wax"},
	Lactic_Peel: 			{time:15,	price:22,	label:"30% Lactic Peel"},
	Eye_Treatment: 			{time:15,	price:15,	label:"Eye Treatment"},
	Cold_Aloe_Mask: 		{time:15,	price:18,	label:"Cold Aloe Mask"},
	High_Frequency: 		{time:15,	price:5 ,	label:"High Frequency"},
	Pumpkin_Peel:			{time:15,	price:15,	label:"Pumpkin Peel"},
	Collagen_Ampoule:		{time:15,	price:15,	label:"Collagen Ampoule"},
	Aroma_Therapy: 			{time:15,	price:8 ,	label:"Aromatherapy"},
	Advanced_Extraction:	{time:15,	price:10,	label:"Advanced Extraction"},
	Hand_Treatment: 		{time:15,	price:10,	label:"Hand Treatment"},
	Makeup_Application: 	{time:30,	price:29,	label:"Makeup Application"},
	Body_Exfoliation:		{time:60,	price:85,	label:"Body Exfoliation"},
	Back_Exfoliation:		{time:60,	price:55,	label:"Back Exfoliation"}
};

// Array of date names used to produce friendly date strings
var dayNames = new Array("Sunday", "Monday", "Tuesday","Wednesday", "Thursday", "Friday", "Saturday");
var monthNames = new Array("January", "February", "March","April", "May", "June", "July", "August", "September", "October", "November", "December");
var monthShortName = new Array("Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

// Regular expressions used to validate form inputs
var emailCheck = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;  // Email validation
var phoneNumberCheck = /^1?([2-9]..)([2-9]..)(....)$/;								 // Phone validation
var bookingSuccess = /SUCCESS/;														 // Checks for a successful response from bookAppointment.php

// Tracks the appointment details
var appointmentDuration = 0;
var totalPrice = 0;
var appointmentDate = null;
var timeSelected = false;

// Track combo deals
// This particular menu has a few special behaviors and these toggles track these
// brow + lip service gets a discount
// brow + lip + chin service gets a discount
// mens chest or mens back requires a quote
var brow 	= false;
var chin 	= false;
var lip  	= false;
var chestmen= false;
var backmen = false;

// The amount to adjust the total price
var adjustment = 0;

// Called whenever a menu service form is checked.  
// It takes the form element that was selected and updates the various environment variables
function toggleService( serviceInput ){

	// Determines if this is a select or deselect
	if( serviceInput.checked ){
		// Add the price and duration of this service to the current total
		appointmentDuration 	+= servicesDB[serviceInput.value ]["time"];
		totalPrice 				+= servicesDB[serviceInput.value ]["price"];

		// Toggle the combo deal variables
		if( serviceInput.value == "Brow" )
			brow = true;
		else if( serviceInput.value == "Lip" )
			lip = true;
		else if( serviceInput.value == "Chin" )
			chin = true;
		else if( serviceInput.value == "Chest_Men" )
			chestmen = true;
		else if( serviceInput.value == "Back_Men" )
			backmen = true;
	}else{
		// Subtract the price and duration of this service from the current total
		appointmentDuration 	-= servicesDB[serviceInput.value]["time"];
		totalPrice 				-= servicesDB[serviceInput.value]["price"];

		// Toggle the combo deal variables
		if( serviceInput.value == "Brow" )
			brow = false;
		else if( serviceInput.value == "Lip" )
			lip = false;
		else if( serviceInput.value == "Chin" )
			chin = false;
		else if( serviceInput.value == "Chest_Men" )
			chestmen = false;
		else if( serviceInput.value == "Back_Men" )
			backmen = false;
	}

	// Add a discount if it is a wax combo
	if(( brow && lip && chin ) || ( lip && chin ))
		adjustment = -8;
	else
		adjustment = 0;

	// Update the running totals that track the current time and price
	updateTotals( "#servicesTabTotals" );
	updateTotals( "#appointmentTabTotals" );
}

// Takes a DOM object and updates the HTML with the current total time and price
function updateTotals( tabToUpdate ){
	// The HTML code that will be injected into the 'tabToUpdate' DOM object
	var output = "";

	// clear the calendar selection, this is because any change to the services invalidates any calendar query
	clearAppointmentDate();

	// if there are services selected, update the price summary
	if( totalPrice > 0 ){

		if( isQuoteable() )
			output = "$" + ( calculatePrice() );
		else
			output = "call for price";

		output += "<br>" + appointmentDuration + " minutes";

		$(tabToUpdate).show();
		enableTab( 1 );
		enableNavButton( "next" );
	// if there are no services, hide all summaries and prevent navigation beyond step 1
	} else {
		$(tabToUpdate).hide();
		disableTab( 1 );
		disableTab( 2 );
		disableNavButton( "next" );
	}

	$(tabToUpdate).html( output );
}

// disable the navigation step button
// navButton: the step button to disable
function disableNavButton( navButton ){
	$("a[href='#" + navButton + "']").css('visibility', 'hidden');
}

// enable the navigation step button
// navButton: the step button to enable
function enableNavButton( navButton ){
	$("a[href='#" + navButton + "']").css('visibility', 'visible');
}

// returns true if we can show the price for the current appointment
// this is currently only to deal with the mens services that are too difficult to quote online
function isQuoteable(){
	return( !(backmen || chestmen) );
}

// Pads a 0 onto a single digit number (used for creating date formats with 00:00 format)
function padTwoDigits( valueToPad ){
	if( valueToPad < 10 )
		return( "0" + valueToPad );
	return( valueToPad + "" );
}

// Get the time that the current appointment ends
function calculateEndTime( startTime ){
	return( new Date( startTime.getTime() + appointmentDuration * 60000 ));
}

// updates a date or time selection in the summary
function updateAppointmentSummary(){
	var appointmentTimeString = "";
	if( timeSelected )
		appointmentTimeString =	"<br><span class='appointmentTimeRange'>" + getTimeString( appointmentDate, appointmentDuration ) + "</span>";

	$("#appointmentConfirm").html( monthShortName[ appointmentDate.getMonth() ] + " " + appointmentDate.getDate() + appointmentTimeString );
}

function processDateSelection( searchDate, duration ){

	$("#timeOptions").hide();
	$("#appointment_spinner").show();

	timeSelected = false;
	disableTab( 2 );
	disableNavButton( "next" );

	$("#appointmentConfirm").show();

	appointmentDate = new Date( searchDate.substring( 0, 4 ), parseInt(searchDate.substring( 4, 6 )) - 1, searchDate.substring( 6, 8 ), 0, 0, 0, 0 );

	updateAppointmentSummary();

	$.post( "php/checkAvailability.php", { date: searchDate, duration: duration })
	    .done(function( responseHTML ) {
	    	$("#appointment_spinner").hide();
	    	$("#timeOptions").show();
	        $("#timeOptions").html( responseHTML );
	    });
}

function updateAppointmentTime( startTime, appointmentDOMObject ){
	appointmentDate = new Date( startTime * 1000 );

	// Indicate that a time has been selected
	timeSelected = true;

	// Reset the active time button
	$(".availableTimeSelected").attr('class', 'availableTime' );

	// Active the new time button
	appointmentDOMObject.className = "availableTimeSelected";

	enableNavButton( "next" );
	enableTab( 2 );

	buildConfirmationPage();

	// Update the displayed appointment summary
	updateAppointmentSummary();
}

function enableTab( tabIndex ){
	if( tabIndex == 1 ){
		$("li[class='disabled'][role='tab']").attr( 'class', 'done' );
	} else if( tabIndex == 2 ){
		$("li[class='disabled last'][role='tab']").attr( 'class', 'done last' );
		$("li[class='last disabled'][role='tab']").attr( 'class', 'last done' );		
	}
}

function disableTab( tabIndex ){
	if( tabIndex == 1 ){
		$("li[class='done'][role='tab']").attr( 'class', 'disabled' );
	} else if( tabIndex == 2 ){
		$("li[class='done last'][role='tab']").attr( 'class', 'disabled last' );
		$("li[class='last done'][role='tab']").attr( 'class', 'last disabled' );		
	}
}

// Reset the date that is selected on the appointment calendar
// This ends up resetting a lot of form elements in the process, so this is a good method to call when trying to reset step 2
function clearAppointmentDate(){
	// grab an instance of the calendar object
	var datepicker = $('#datepicker').data("Zebra_DatePicker");

	// reset that fucker
	datepicker.clearDate();

	// show the helper arrow
	showAppointmentHelper();

	// hide the appointment date tracker
	$("#appointmentConfirm").hide();

	// reset the appointment date
	appointmentDate = null;

	// reset the appointment time tracker
	timeSelected = false;

	// reset the confirmation page (this is in case someone selects a date after a confirmation page has already been rendered)
	$("#confirm_servicesFacialPane").html("");

	// turn the confirmation tab off (this is because you can't get to the confirmation page without selecting a date)
	disableTab( 2 );
}

// Show the arrow that instructs the user to select a calendar date
function showAppointmentHelper(){
	$("#timeOptions").html("<div class='arrow_box'>Select a day from the calendar<br>to see what appointments are available.<br></div>");
}

// Returns the total price when all discount adjustments are taken into consideration
// This can be used in the future to introduce more complex types of price calcuations
function calculatePrice(){
	return( totalPrice + adjustment );
}

// Builds the confirmation page HTML
// There are a lot of very layout specific design decisions being made here
// a lot of it has to do with the face that facials are the major product being sold
function buildConfirmationPage(){
	
	// Only build the page if there is actually a time selected
	if( timeSelected ){
		// The HTML output stream
		var output = "";

		// The list of services that are requested
		var services = new Array();

		// The name of the facial being performed
		var facial   = "";

		// Build the list of services from the menu on step 1
		$("input:checked").each(function(){
			// Either set the facial name or add it to the general services list
			// According to the rules of the menu, there can only be one facial accompanied by any number of other services
			if( this.name == 'facial' )
				facial = this.value;
			else
				services.push( this.value );
		});

		// Use the facial confirmation page format
		if( facial != "" ){
			// Display the big facial service confirmatoin
			$("#confirm_servicesFacialPane").html( servicesDB[facial]["label"] );
			$("#confirm_servicesFacialPane").show();
			
			// show the other services that are part of the appointment
			// the different options are scaled out to provide more room for a larger number of services
			if( services.length == 0 ){
				$("#confirm_servicesFacialPane").attr( "class", "confirm_servicesFacialPaneMax" );
				output += "<table>";
			} else if( services.length <= 3 ){
				$("#confirm_servicesFacialPane").attr( "class", "confirm_servicesFacialPaneMid" );
				output += "<table class='confirm_servicesTableMid'>";
			} else {
				$("#confirm_servicesFacialPane").attr( "class", "confirm_servicesFacialPane" );
				output += "<table class='confirm_servicesTable'>";
			}
		// If no facials are being requested, just display a normal grid
		} else {
			$("#confirm_servicesFacialPane").hide();
			output += "<table class='confirm_servicesTableMax'>";
		}

		var currentColumn = 1;  // Current column index, used to keep track of the current grid column
		var maxCol = 4;			// The maximum number of columns to build service gruid with

		// Iterate through the service list and build the table of services
		for( var i = 0 ; i < services.length ; i++ ){
			// If it is the first column, add a new row tag
			if( currentColumn == 1 )
				output += "<tr>";

			// add the cell attribute
			output += "<td width='" + ( 100 / Math.min( maxCol, services.length )) + "%' ";

			// Override the default font in the unlikely event that someone selects a massive amount of services
			if( services.length > 12 )
				output += "style='font-size:11px'";
			else if(( services.length > maxCol ) && ( facial == "" ))
				output += "style='font-size:15px'";

			// add the current service to the table cell
			output +=">" + servicesDB[services[i]]["label"] + "</td>";

			// increment the column counter
			currentColumn++;

			// if the next column exceeds the max, reset the row and column counter
			if( currentColumn > maxCol ){
				if( i + 1 < services.length )
					currentColumn = 1;
				output += "</tr>";
			}
		}

		// clean up the remaining cells (this ensures that the table is symetrical)
		if(( currentColumn < maxCol ) && ( services.length > maxCol )){
			for( var i = 0 ; i < maxCol - currentColumn ; i++ )
				output += "<td> </td>";
			output += "</tr>";
		}

		output += "</table>";

		// display the confirmation page
		$("#confirm_servicesSummary").html( output );

		// The following commands update the summary content in the header
		// update the appointment date summary
		$("#confirm_appointmentDate").html( getDateString( appointmentDate ) );

		// update the appointment time summary
		$("#confirm_appointmentTime").html( getTimeString( appointmentDate, appointmentDuration ));

		// calculate the current price
		if( isQuoteable() )
			output = "$" + ( calculatePrice() );
		else
			output = "call for price";

		// update the appointment price summary
		$("#confirm_appointmentPrice").html( output );
	}

}

// Puts the number suffix on date days (e.g. 23rd or 21st)
// Used to make human readable dates nicer
function nth(d) {
  if(d>3 && d<21) return 'th'; // thanks kennebec
  switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

// Shows or hides the helper arrow in the contact form
// This arrow indicates that an email or phone number is required for entry
function showContactFormHelper(){
   	if(( $("#confirm_emailInput").val() != "" ) || ( $("#confirm_phoneInput").val() != "" )){
		$("#confirm_inputHelper").css( 'visibility', 'hidden' );
		showContactFormFormatHelpers();
	} else {
		$("#confirm_inputHelper").css( 'visibility', 'visible' );
		hideContactFormFormatHelpers();
	}
}

// Hides the email and phone format helpers (these are the notes that help the user with input formatting e.g. this@email.com)
function hideContactFormFormatHelpers(){
	$("#confirm_phoneFormatHelper").css( 'visibility', 'hidden' );
	$("#confirm_emailFormatHelper").css( 'visibility', 'hidden' );
}

// Shows the email and phone format helpers (these are the notes that help the user with input formatting e.g. this@email.com)
function showContactFormFormatHelpers(){
	$("#confirm_phoneFormatHelper").css( 'visibility', 'visible' );
	$("#confirm_emailFormatHelper").css( 'visibility', 'visible' );
}

// Returns a string that represents the start and end times of a given appointment
// startDate: the date of the appointment
// duration:  the duration of the appointment
function getTimeString( startDate, duration ){
	// Update the appointment date and time
	var appointmentEndDate = calculateEndTime( appointmentDate );

	var startHour = appointmentDate.getHours();
	if( startHour > 12 )
		startHour = padTwoDigits( startHour - 12 );

	return( adjustMilitaryHours( appointmentDate.getHours()) + ":" + padTwoDigits( appointmentDate.getMinutes()) + " - " + 
			adjustMilitaryHours( appointmentEndDate.getHours()) + ":" + padTwoDigits( appointmentEndDate.getMinutes()));
}

function adjustMilitaryHours( militaryHours ){
	if( militaryHours > 12 )
		return( militaryHours - 12 );

	return( militaryHours );
}

function getDateString( sourceDate ){
	return( dayNames[appointmentDate.getDay()] + ", " + 
			monthNames[appointmentDate.getMonth()] + " " + 
			appointmentDate.getDate() + nth(appointmentDate.getDate()) );
}

// Processes the final step of the online booking process.
// This makes a call to bookAppointment.php with the all appointment details 
function processFormSubmission(){

	$("a[href='#finish']").hide();;
	$("#confirm_submitSpinner").show();

	var servicesList = "";
	$("input:checked").each(function(){ servicesList += servicesDB[$(this).val()]["label"] + ","; });

	var phoneString = "";
	if( $("#confirm_phoneErrorIcon").attr( 'class' ) == 'confirm_errorMsgValid')
		phoneString = $("#confirm_phoneInput").val();

	var emailString = "";
	if( $("#confirm_emailErrorIcon").attr( 'class' ) == 'confirm_errorMsgValid')
		emailString = $("#confirm_emailInput").val();

	/*$("#debugOutput").html( "<pre>\n" +
							"date:" + escape( appointmentDate.getTime() / 1000) + "\n" +
							"timeStr:" + escape( getTimeString( appointmentDate, appointmentDuration )) + "\n" +
							"dateStr:" + escape( getDateString( appointmentDate )) + "\n" +
							"duration:" + appointmentDuration + "\n" +
							"price:" + calculatePrice() + "\n" +
							"emailString:" + escape( emailString ) + "\n" +
							"phone:" + escape( phoneString ) + "\n" +
							"name:" + escape( $("#confirm_nameInput").val()) + "\n" +
							"services:" + escape( servicesList) + "\n" );*/

	$.post( "php/bookAppointment.php", { date:  escape( appointmentDate.getTime() / 1000),
									 timeStr:  	escape( getTimeString( appointmentDate, appointmentDuration )),
									 dateStr:  	escape( getDateString( appointmentDate )),
									 duration: 	appointmentDuration,
									 price:		calculatePrice(),
									 email: 	escape( emailString ),
									 phone:		escape( phoneString ),
									 name: 		escape( $("#confirm_nameInput").val()),
									 services: 	escape( servicesList) })
		.done(function( responseHTML ) {
			$("#confirm_submitSpinner").hide();

			$("#confirm_emailcell").css( 'visibility', 'hidden' );
			$("#confirm_phonecell").css( 'visibility', 'hidden' );
			$("#confirm_namecell").css( 'visibility', 'hidden' );

			$("li[role='tab']").css( 'visibility', 'hidden' );
			$("a[role='menuitem']").css( 'visibility', 'hidden' );
			$(".confirm_errorMsg").css( 'visibility', 'hidden' );
			$("#confirm_nameErrorIcon").css( 'visibility', 'hidden' );

			if( bookingSuccess.test( responseHTML ) ){
				$("#confirm_submitFinished").show();
				$("#confirm_clientTips").show();
			} else {
				$("#confirm_submitFailed").show();
				$("#confirm_clientErrorTips").show();
			}

			$("#bookAgain").show();
	    });
}

function cleanupFinishButton(){
	if( ( $("#confirm_nameErrorIcon").attr( 'class' ) == 'confirm_errorMsgValid' ) &&
	   (( $("#confirm_phoneErrorIcon").attr( 'class' ) == 'confirm_errorMsgValid' ) || ( $("#confirm_emailErrorIcon").attr( 'class' ) == 'confirm_errorMsgValid' ))){
		$("a[href='#finish']").show();
		hideContactFormFormatHelpers();
	} else {
		$("a[href='#finish']").hide();
		//hideContactFormFormatHelpers();
	}
}