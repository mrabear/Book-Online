<?php
	// Includes some of the common variables and libraries used by the scripts that need to access the calendar and email services

	// The caldav client library that handles connecting to the icloud calendar
	require 'lib/caldavClient2.php';

	// Simple methods that help manage the data returned from the caldav client
	require 'lib/caldavUtils.php';

	// Set the default time zone for all time calculations
	date_default_timezone_set("America/New_York");

	// Calendar calculation constants, helps when converting things into seconds
	$_WEEK 	 = 604800;
	$_DAY	 = 86400;
	$_HOUR	 = 3600;
	$_MINUTE = 60;

	// Turns debug messages on
	$debug = false;

	// Connection information for the iCloud calendar
	// Use the php/tools/icloud.php script to figure this information out
	// You will need to provide it with the iCloud login of the calendar user that you want to use
	// (the same one defined by $calUser and $calPass)
	$calUser 		= "xxxxxx@xxxx.com";
	$calPass 		= "xxxxxxxxx";
	$calServerURI	= "https://xxx-caldav.icloud.com";
	$calendarURI	= "/xxxxxxx/calendars/xxxxxxxxx/";
	$calendarName	= "xxxxx";

	// Email authentication information
	$emailHost 	    = "xxxx.xxxx.net";  	  // Specify main and backup SMTP servers
	$emailSMTPAuth  = true;                           // Enable SMTP authentication
	$emailUsername  = "xxxxx@xxxxx.com"; // SMTP username
	$emailPassword  = "xxxxxxxxx";                 // SMTP password
	$emailPort 	    = 25;                             // TCP port to connect to

	// Email addresses and other properties
	$emailToAddr	= "xxxxx@xxxxx.com";
	$emailToAddrName= "xxxxx xxxxx";
	$emailBizName	= "Verbena Esthetics Studio";
    $emailFromAddr  = "appointments@verbenaesthetics.com";
?>