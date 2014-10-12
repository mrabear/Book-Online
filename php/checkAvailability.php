<?php
	require "config.php";

	// Grab the search date and appointment duration from the post submission
	$searchDate = strtotime( $_POST['date'] );
	$duration 	= $_POST['duration'] * $_MINUTE;

	if( $duration <= 0 )
		$duration = 15 * $_MINUTE;

	// Create a new instance of the cal
	$cal = new CalDAVClient( $calServerURI . $calendarURI, $calUser, $calPass, $calendarName );

	// Create a start and end range for the calendar search.  
	// This is padded with one hour on either side to take care of timezone conversion issues
	$fetchStartDateTime = date( "Ymd\THis\Z", $searchDate - $_HOUR );
	$fetchEndDateTime = date( "Ymd\THis\Z", $searchDate + ( $_DAY + $_HOUR ) );

	// Fetch all events for this day
	$events = $cal->GetEvents( $fetchStartDateTime, $fetchEndDateTime );

	// Two lists containing the start and end times of each calendar event
	$eventStart = array();
	$eventEnd = array();

	//print_r( $events );

	if( $debug ) print( "duration: " . $duration . "<br>");

	// Loop through all of the discovered events in the calendar and parse the data stream for important data.
	foreach ( $events AS $k => $event ) {

		// Grab the data stream for the current event
		$event_data = $event[ 'data' ];

		// Parse the data stream into an array
		$eventDataList = array_pop( icsToArray( $event_data ) );

		// Search for the node that contains the main event information
		// It tends to be toward the bottom of the data stream, so I search from the bottom-up
		foreach( array_reverse( icsToArray( $event_data ) ) as $eventDataList ){
			if( $eventDataList['SUMMARY'] != "" )
				break;
		}

		// Grab relavent event data from the stream
		$summary   = $eventDataList['SUMMARY'];
		$location  = $eventDataList['LOCATION'];
		$frequency = $eventDataList['RRULE'];
		$startTime = iCalDateToUnixTimestamp( $eventDataList[ array_pop( preg_grep( "/DTSTART.*?/", array_keys($eventDataList) ) )] );
		$endTime   = iCalDateToUnixTimestamp( $eventDataList[ array_pop( preg_grep( "/DTEND.*?/",   array_keys($eventDataList) ) )] );

		// Override the date of a recurring meeting
		// This is to get around a problem of the current instance of a repeating event having the date of the first occurance rather than the current one
		// In this case, we are only overriding events that recur on a weekly basis
		if( !empty( $frequency ) ){
			if( $debug ) print "(" . $frequency . ")";

			$startTime = iCalDateToUnixTimestamp( date( "Ymd\T", $searchDate ) . date( "His\Z", $startTime ) );
			$endTime   = iCalDateToUnixTimestamp( date( "Ymd\T", $searchDate ) . date( "His\Z", $endTime   ) );
		} else if( $debug ) print "(non-recurring)";

		// If the event happens on the same date as the search date, add it to the list of events to consider when trying to book an appointment
		// This is a necessary step because the slightly expanded search range sometimes catches events on the next or previous day
		if( date( 'Y-m-d', $startTime ) == date( 'Y-m-d', $searchDate )) {
			array_push( $eventStart, $startTime );
			array_push( $eventEnd , $endTime);

			//print $event_data;
			if( $debug ) print $summary . " " . $location . " @ " . date( 'H:i', $startTime) . " - " . date( 'H:i', $endTime) . "<br>\n";
		} else {
			//print_r( $event_data );
			if( $debug ) print "IGNORED: " . $summary . " " . $location . " @ " . date( 'H:i', $startTime) . " - " . date( 'H:i', $endTime) . "<br>\n";
		}

	}
	
	// The minimum increment to try and find an available time
	// e.g. A 20 minute increment will search 1:00, 1:20, 1:40, 2:00
	$increment = 20 * $_MINUTE;

	// The number of columns to display the times in
	$columns = 3;

	// Keeps track of the current column
	$column_count = 0;

	// Set to true if the current time range conflicts with an existing event
	$conflict = false;


	$currentTime = $searchDate;

	//print $currentTime . "<br>";

	if( date( 'Y-m-d', time() ) == date( 'Y-m-d', $searchDate )){
		// The start of the day, where the time slot check will start from
		$currentTime = time() + 2 * $_HOUR;
		
		// Bump up the time to the next available time slot
		$currentTime += ( $increment - ( $currentTime % $increment ));

		// Trim off the seconds of the current time
		$currentTime -= ( $currentTime % $_MINUTE );
	}

	// The end of the day, signals that there are no more time slots to check
	$endOfDay = $searchDate + $_DAY; //86100;

	// Add cleanup padding at the end of longer sessions
	// 15 minute cleanup time for 45 minutes or more
	// 30 minute cleanup time for 120 minutes or more
	if( $duation >= 120 * $_MINUTE )
		$duration += ( 30 * $_MINUTE );   // +1800 seconds
	else if( $duration >= 45 * $_MINUTE )
		$duration += ( 15 * $_MINUTE );   // +900 seconds

	// Print the header
	print "<center>";
	//print "<span style='font-size: 20px;'>Available appointments on " . date( 'm/j', $searchDate ) . ":</span>\n<hr class='blueLineSolid' width=300>";

	// Start the grid of available days
	print "<table width=90%>";

	// A counter used to build the table structure, let's me know
	$totalAvailableSlots = 0;

	// Start at the beginning of the day and check every time slot at the increment specified above.
	// If there is no conflict for that time slot, add it to the list of available times
	for( ; $currentTime < $endOfDay ; $currentTime += $increment ){

		// Reset the conflict flag
		$conflict = false;

		// Check the current time slot against the current list of events for the day
		// Signal a conflict if the event overlaps with the current event
		for( $i = 0 ; $i < count( $eventStart ) ; $i++){
			//print "<span style='color:";
			if( !( ($currentTime + $duration <= $eventStart[$i] ) || ( $eventEnd[$i] <= $currentTime ) ) ){
				$conflict = true;
			}

			//print( "'>loop time: " . date( 'H:i', $currentTime + $duration) . "<=" . date( 'H:i', $eventStart[$i] ) . " | " . date( 'H:i', $eventEnd[$i] ) . "<=" . date( //'H:i',  $currentTime ) . "</span><br>");
		}
		//print "<hr>";

		// If there is no conflict, display the time as an available option
		if (!$conflict){
			if( $column_count == 0 )
				print "<tr>";

			$column_count++;
			$totalAvailableSlots++;

			print "<td><a class='availableTime' id='" . $currentTime . "' onClick='updateAppointmentTime( " . $currentTime . ", this );'>" . date( 'h:ia', $currentTime) . "</a></td>";
		}
		//else{
		//	$column_count++;
		//	print "<td  class='availableTime'><span style='color: #FF0000;'>"  . date( 'h:ia', $currentTime) . "</span></td>";
		//}

		if( $column_count == $columns ){
			print "</tr>";
			$column_count = 0;
		} 
	}

	print "</table>";

	if( $totalAvailableSlots <= 0 ){
		print "<div class='appointment_noTimeMessage'>No Availability<br>on this Day</div>";
	}

	print "</center>";
?>