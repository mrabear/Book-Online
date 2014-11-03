// This contains all of the code needed to load the various third party libraries used by the online booking tool

// This is the module loader for iCheck
// iCheck is used in the first step to govern the menu selections
// Documentation located at: https://github.com/fronteed/iCheck/
$(document).ready(function(){
	$("input[type=checkbox], input[type=radio]").each(function(){
    var self = $(this),
      label = self.next(),
      label_text = label.text();

    self.on('ifToggled', function(event){
		toggleService( event.target );
	});

    self.on('ifClicked', function(event){
		if(( event.target.type == "radio" ) && ( event.target.checked )){
			event.target.checked = false;
			toggleService( event.target );
			$("input[type=radio]").each(function(){$(this).iCheck('update')});
		}
	});

    label.remove();
    self.iCheck({
      checkboxClass: 'icheckbox_line-blue',
      radioClass: 'iradio_line-blue',
      insert: '<div class="icheck_line-icon"></div>' + label_text
    });
  });
});

// This is the module loader for jquery.steps.js
// steps is the library that is used to track and transition each step of the form
// Documentation located at: https://github.com/rstaib/jquery-steps/wiki
$("#wizard").steps({
	transitionEffect: 		"slideLeft",
	transitionEffectSpeed:	200,
	enableAllSteps: 		false,
	enablePagination: 		true,

	// This is called after the form has moved from one step to the next
	onStepChanged: function (event, currentIndex, priorIndex) { 
		// Third step (confirmation page)
		if( currentIndex == 2 ){
			buildConfirmationPage();
			disableNavButton( "next" );
			cleanupFinishButton();
		// Second step (date/time selection page)
		}else if( currentIndex == 1 ){
			if( timeSelected )
				enableNavButton( "next" );
			else
				disableNavButton( "next" );
		// First step (service selection page)
		} else if( currentIndex == 0 ){
			if( appointmentDuration > 0 )
				enableNavButton( "next" );
			else
				disableNavButton( "next" );
		}
	},

	// This is called right before the form is about to move
	onStepChanging: function (event, currentIndex, newIndex) {
        // Allways allow step back to the previous step even if the current step is not valid!
        if( currentIndex > newIndex ){
        	if( newIndex == 0 )
        		// If we're navigating back to the first page, kill the previous button
				disableNavButton( "previous" );

			if( currentIndex == 2 )
				cleanupFinishButton();

            return true;
        }

		if( currentIndex == 0 ){
			// Advance if services have been selected
			if( appointmentDuration > 0 ){
				enableNavButton( "previous" );
				return true;
			}

			// Do not advance if no services have been selected
			return false;
		} else if( currentIndex == 1 ){
			// Advance if a time has been selected
			if( timeSelected ){
				return true;
			}

			// Do not advance if no time has been selected
			return false;
		}
	},

	// This is called when the form is first created
	onInit: function( event, currentIndex){
		// Hide the previous button
		disableNavButton( "previous" );
		disableNavButton( "next" );
		$("a[href='#finish']").attr( "style", "position: absolute; left: 432px; top: -163px; height: 94px; width: 152px; padding-top: 37px;" );
		$("a[href='#finish']").hide();
		$("a[href='#next']").css( "position", "relative" );
		$("a[href='#next']").css( "right", "-7px" );
		$("a[href='#previous']").css( "position", "relative" );
		$("a[href='#previous']").css( "left", "-3px" );
		$("#confirm_nameErrorIcon").css( 'visibility', 'visible' );
		$("#wizard").show();
	},

	// This is called when the form is submitted
	onFinished: function (event, currentIndex) { 
		processFormSubmission();
	},

	/* Labels */
	labels: {
		finish: "Confirm Appointment"
	}
});

// This is the module loader for zebra_datepicker
// zebra_datepicker is used on the second page for presenting a nice calendar to select dates from
// Documentation located at: https://github.com/stefangabos/Zebra_Datepicker/
$('#datepicker').Zebra_DatePicker({
  always_visible: $('#container'),
  direction: true,
  format: 'Ymd',
  show_clear_date: false,
  zero_pad: true,
  disabled_dates: ['* * * 0,1'],
  onSelect: function( date, dateDefault, dateObj, datepicker, weekNumber ) {
  	processDateSelection( date, appointmentDuration );
  }
});

// The email input detector
// This method is called whenever a key is pressed on the email input field
// The contents of the field are validated and either a check of x will appear
$("#confirm_emailInput").on( 'keyup', function(e){
		showContactFormHelper();

		if( emailCheck.test( $("#confirm_emailInput").val() )){
			$("#confirm_emailErrorIcon").attr( 'class', 'confirm_errorMsgValid' );
			
		} else {
			$("#confirm_emailErrorIcon").attr( 'class', 'confirm_errorMsgInvalid' );
		}

		cleanupFinishButton();
	});

// The phone input detector
// This method is called whenever a key is pressed on the phone input field
// The contents of the field are validated and either a check of x will appear
$("#confirm_phoneInput").on( 'keyup', function(e){
    	showContactFormHelper();

    	var raw_number = $("#confirm_phoneInput").val().replace(/[^0-9]/g,'');
    	if( phoneNumberCheck.test( raw_number )){
			$("#confirm_phoneErrorIcon").attr( 'class', 'confirm_errorMsgValid' );
		} else {
			$("#confirm_phoneErrorIcon").attr( 'class', 'confirm_errorMsgInvalid' );
		}

		cleanupFinishButton();
	});

// The name input detector
// This method is called whenever a key is pressed on the name input field
// The contents of the field are validated and either a check of x will appear
$("#confirm_nameInput").on( 'keyup', function(e){
    	if( $("#confirm_nameInput").val() != "" ){
			$("#confirm_nameErrorIcon").attr( 'class', 'confirm_errorMsgValid' );
    	} else {
			$("#confirm_nameErrorIcon").attr( 'class', 'confirm_errorMsgInvalid' );   	        		
    	}

		cleanupFinishButton();
	});

// These are the two loaders for the spin.js module
// spin.js is used to show a loading spinners
// Documentation located at: http://fgnass.github.io/spin.js/

// The calendar selection loading spinner
var appointmentSpinnerOptions = {
	  lines: 9, // The number of lines to draw
	  length: 21, // The length of each line
	  width: 10, // The line thickness
	  radius: 19, // The radius of the inner circle
	  corners: 1, // Corner roundness (0..1)
	  rotate: 0, // The rotation offset
	  direction: 1, // 1: clockwise, -1: counterclockwise
	  color: '#ffffff', // #rgb or #rrggbb or array of colors
	  speed: 0.8, // Rounds per second
	  trail: 44, // Afterglow percentage
	  shadow: false, // Whether to render a shadow
	  hwaccel: false, // Whether to use hardware acceleration
	  className: 'spinner', // The CSS class to assign to the spinner
	  zIndex: 9999999999 // The z-index (defaults to 2000000000)
	  //top: '50%', // Top position relative to parent
	  //left: '50%' // Left position relative to parent
};

// The form submission loading spinner
var confirmSpinnerOptions = {
	  lines: 9, // The number of lines to draw
	  length: 16, // The length of each line
	  width: 6, // The line thickness
	  radius: 10, // The radius of the inner circle
	  corners: 1, // Corner roundness (0..1)
	  rotate: 0, // The rotation offset
	  direction: 1, // 1: clockwise, -1: counterclockwise
	  color: '#457AB8', // #rgb or #rrggbb or array of colors
	  speed: 0.8, // Rounds per second
	  trail: 44, // Afterglow percentage
	  shadow: false, // Whether to render a shadow
	  hwaccel: false, // Whether to use hardware acceleration
	  className: 'spinner', // The CSS class to assign to the spinner
	  zIndex: 9999999999 // The z-index (defaults to 2000000000)
	  //top: '50%', // Top position relative to parent
	  //left: '50%' // Left position relative to parent
};

// The spinner objects
var appointment_spinnerPtr = document.getElementById('appointment_spinner');
var appointmentSpinnerObj = new Spinner( appointmentSpinnerOptions ).spin( appointment_spinnerPtr );
var confirmSpinnerObj = new Spinner( confirmSpinnerOptions ).spin( confirm_submitSpinner );