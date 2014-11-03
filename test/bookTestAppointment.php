<?php

	require '../php/lib/phpmail/PHPMailerAutoload.php';

	// The caldav client library that handles connecting to the icloud calendar
	require '../php/config.php';

	// Creates a new mailer object with the basic server and authentication information
	// It is up to you to add the email specific information to this object prior to sending
	function createMailer(){
		$mail = new PHPMailer;

		$mail->isSMTP();                    // Set mailer to use SMTP
		$mail->Host = 	  $GLOBALS['emailHost']; 		// Specify main and backup SMTP servers
		$mail->SMTPAuth = $GLOBALS['emailSMTPAuth'];    // Enable SMTP authentication
		$mail->Username = $GLOBALS['emailUsername'];	// SMTP username
		$mail->Password = $GLOBALS['emailPassword'];    // SMTP password
		$mail->Port = 	  $GLOBALS['emailPort'];      	// TCP port to connect to
		$mail->isHTML(true);                // Set email format to HTML

		return( $mail );
	}

	// Grab the appoitnment information from the query string
	$appointmentDate	 	= urldecode ( $_POST['date'] 		);
	$appointmentDuration 	= urldecode ( $_POST['duration'] 	);
	$appointmentTimeStr		= urldecode ( $_POST['timeStr']		);
	$appointmentDateStr		= urldecode ( $_POST['dateStr']		);
	$appointmentPrice		= urldecode ( $_POST['price']		);
	$appointmentEmail		= urldecode ( $_POST['email']		);
	$appointmentPhone		= urldecode ( $_POST['phone']		);
	$appointmentServices	= str_replace( ",", ", ", urldecode ( $_POST['services'] ));
	$appointmentName		= urldecode ( $_POST['name']		);

	// Create an HTML formatted version of the services list, which is transmitted as comma delimited
	$servicesHTML = str_replace( ",", "<br>", $appointmentServices );

	// Set the success flag to failure by default
	$success = false;

	// Define all of the components of the caldav calendar object
	$uid = "BookOnline" . uniqid();
	$location = $appointmentServices;
	$description = $appointmentPhone . " " . $appointmentEmail . " $" . $appointmentPrice . " [booked online]";
	$summary = $appointmentName;
	$tstart = date( "Ymd\THis", $appointmentDate ); //"20140926T140000"
	$tend   = date( "Ymd\THis", $appointmentDate + ( $appointmentDuration * $_MINUTE ) ); //"20140926T150000"
	$tstamp = gmdate("Ymd\THis");

	// Construct a caldav formatted object
$CalDavBody = <<<__EOD
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:$tstamp
DTSTART:$tstart
DTEND:$tend
UID:$uid
DESCRIPTION:$description
LOCATION:$location
SUMMARY:$summary
END:VEVENT
END:VCALENDAR
__EOD;

	// Connect to the calendar server and publish the new event
	$cal = new CalDAVClient( $calServerURI . $calendarURI, $calUser, $calPass, $calendarName );
	$eid = $cal->DoPUTRequest( $calendarURI . $uid . ".ics", $CalDavBody, '*' );

	// Determine the outcome of the event publishing
	if( $eid != "" ){
		print "1";
		$cal->DoDELETERequest( $calendarURI . $uid . ".ics", $eid );
	} else {
		print "0";
	}


	// Send confirmation emails

	// Build the administrative confirmation email body
	$EmailBody = <<<__EOD
This was sent as part of a test of the bookOnline tool.  If you are seeing this email, this portion of the test was successful.
__EOD;

	// Build the mail object
	$mail = createMailer();
	$mail->setFrom($emailFromAddr, $appointmentName);
	$mail->addAddress( $emailToAddr, $emailToAddrName);     	  // Add a recipient
	//$mail->addAddress( "mrabear@gmail.com", $emailToAddrName);     	  // Add a recipient

	$mail->Subject = "[BookOnline Test] SUCCESS!";
	$mail->Body = $errorMsg . $EmailBody;
	$mail->AltBody = $errorMsg . $EmailBody;

	// Send the email and record the results
	$success = $mail->send();

	// Respond to the AJAX request
	// The javascript on the other side is looking for either a "SUCCESS" or "FAILURE" response from this php script
	// This is the only output that should be returned
	if( $success )
		print "1";
	else
		print "0";
?>