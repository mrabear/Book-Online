<?php

	require 'lib/phpmail/PHPMailerAutoload.php';

	// The caldav client library that handles connecting to the icloud calendar
	require 'config.php';

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
	if( $eid != "" )
		$success = true;
	else
		$success = false;

	// Send confirmation emails

	// If the calendar step failed, add an error message to notify the admin that this will need to be done manually
	$errorMsg = "";
	if( !$success )
		$errorMsg .= "THERE WAS A PROBLEM ADDING THIS TO THE CALENDAR SO YOU WILL HAVE TO ADD THIS MANUALLY.  LET ME (Brian) KNOW THAT YOU SEE THIS ERROR MESSAGE :) I LOVE YOU HONEY BUNNY<BR><BR>";

	// Build the administrative confirmation email body
	$EmailBody = <<<__EOD
		<table style='font-size: 20px; color: #000000; border: 1px solid #000000; border-collapse: collapse;'>
			<tr>
				<th colspan=2>Online Booking Summary</th>
			</tr>
			<tr>
				<td width='25%' style='padding: 5px; border: 1px solid #000000'>Client:</td>
				<td  width='75%' style='padding: 5px; border: 1px solid #000000'> $appointmentName </td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'>Date:</td>
				<td style='padding: 5px; border: 1px solid #000000'> $appointmentDateStr </td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'>Time:</td>
				<td style='padding: 5px; border: 1px solid #000000'> $appointmentTimeStr </td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'>Duration:</td>
				<td style='padding: 5px; border: 1px solid #000000'> $appointmentDuration minutes</td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'>Price:</td>
				<td style='border: 1px solid #000000'>$ $appointmentPrice </td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'>E-Mail:</td>
				<td style='padding: 5px; border: 1px solid #000000'> $appointmentEmail </td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'>Phone:</td>
				<td style='padding: 5px; border: 1px solid #000000'> $appointmentPhone </td>
			</tr>
			<tr>
				<td style='padding: 5px; border: 1px solid #000000'valign='top'>Services<br>Requested:</td>
				<td style='padding: 5px; border: 1px solid #000000'> $servicesHTML </td>
			</tr>
		</table>
__EOD;

	// Build the mail object
	$mail = createMailer();
	$mail->setFrom($emailFromAddr, $appointmentName);
	$mail->addAddress( $emailToAddr, $emailToAddrName);     	  // Add a recipient

	// If there was an issue creating the calendar event, be obvious about it and attach a whiny prefix
	$subjectPrefix = "[Online Booking] ";
	if( !$success )
		$subjectPrefix = "[Online Booking - !!!NOT IN CALENDAR!!!] ";

	$mail->Subject = $subjectPrefix . $appointmentName . " on " . date( "m\-d \@ h:i", $appointmentDate );
	$mail->Body = $errorMsg . $EmailBody;
	$mail->AltBody = $errorMsg . $EmailBody;

	// Send the email and record the results
	$success = $mail->send() || $success;

	// Respond to the AJAX request
	// The javascript on the other side is looking for either a "SUCCESS" or "FAILURE" response from this php script
	// This is the only output that should be returned
	if( $success )
		print "SUCCESS";
	else
		print "FAILURE";

	// Send a confirmation email if an email address was provided
	if( $appointmentEmail != "" ){
		// Build the client email object
		$clientMail = createMailer();

		// Build the client email body
		$EmailBody = <<<__EOD
		Your Scheduled Appointment:
		<br>
		<table style='width=100%; font-size: 20px; background-color: #CCCCCC; color: #000000; border: 1px solid #000000; border-collapse: collapse;'>
			<tr>
				<td style='padding: 20px; border: 1px solid #000000'>$servicesHTML</td>
				<td style='padding: 20px; border: 1px solid #000000'>$appointmentDateStr<br>$appointmentTimeStr</td>
			</tr>
		</table>
		<br>
__EOD;

		// Build a text only body just in case we are dealing with an email system that can't render HTML 
		$EmailAltBody = <<<__EOD
		Your Scheduled Appointment:\r\n
		\r\n
		$servicesHTML\r\n
		$appointmentDateStr\r\n
		$appointmentTimeStr\r\n
__EOD;

		// Populate the rest of the email properties and send
		$clientMail->Subject = "xxxxxx Appointment Confirmation";    // Define a subject
		$clientMail->Body = $EmailBody;                               // Attach the HTML
		$clientMail->AltBody = $EmailAltBody;                         // Attach the text body
		$clientMail->addAddress($appointmentEmail, $appointmentName); // Add a recipient
		$clientMail->setFrom($emailToAddr, $emailBizName);            // Set the from address
		$clientMail->send();                                          // Send the email
	}
?>