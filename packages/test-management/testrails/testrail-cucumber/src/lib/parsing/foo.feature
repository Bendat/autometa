
Feature: Booking a Hostel
    Scenario: A Traveller Successfully books for future dates
        Given Richard searches for a hostel in 'Porto'
        And selects 'The Grand Liliana'
    Example:
            # start represents the date in <start> days from now, and end
            # for <end> days from now. 0 = today
            | startDaysFromNow | endDaysFromNow |
            | 0                | 3              |
            | 9                | 11             |
