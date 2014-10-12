<?php
	function icsToArray($icsRAW) {
	    //$icsFile = file_get_contents($paramUrl);

	    $icsData = explode("BEGIN:", $icsRAW);

	    foreach($icsData as $key => $value) {
	        $icsDatesMeta[$key] = explode("\n", $value);
	    }

	    foreach($icsDatesMeta as $key => $value) {
	        foreach($value as $subKey => $subValue) {
	            if ($subValue != "") {
	                if ($key != 0 && $subKey == 0) {
	                    $icsDates[$key]["BEGIN"] = $subValue;
	                } else {
	                    $subValueArr = explode(":", $subValue, 2);
	                    $icsDates[$key][$subValueArr[0]] = $subValueArr[1];
	                }
	            }
	        }
	    }

	    return $icsDates;
	}

    /** 
     * Return Unix timestamp from ical date time format 
     * 
     * @param {string} $icalDate A Date in the format YYYYMMDD[T]HHMMSS[Z] or
     *                           YYYYMMDD[T]HHMMSS
     *
     * @return {int} 
     */ 
    function iCalDateToUnixTimestamp($icalDate) 
    { 
    	//print "Parsing:" . $icalDate . "<br>";

        $icalDate = str_replace('T', '', $icalDate); 
        $icalDate = str_replace('Z', '', $icalDate); 

        $pattern  = '/([0-9]{4})';   // 1: YYYY
        $pattern .= '([0-9]{2})';    // 2: MM
        $pattern .= '([0-9]{2})';    // 3: DD
        $pattern .= '([0-9]{0,2})';  // 4: HH
        $pattern .= '([0-9]{0,2})';  // 5: MM
        $pattern .= '([0-9]{0,2})/'; // 6: SS
        preg_match($pattern, $icalDate, $date); 

        // Unix timestamp can't represent dates before 1970
        if ($date[1] <= 1970) {
            return false;
        } 
        // Unix timestamps after 03:14:07 UTC 2038-01-19 might cause an overflow
        // if 32 bit integers are used.
        $timestamp = mktime((int)$date[4], 
                            (int)$date[5], 
                            (int)$date[6], 
                            (int)$date[2],
                            (int)$date[3], 
                            (int)$date[1]);
        return  $timestamp;
    }
?>