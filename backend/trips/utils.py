from collections import deque


def calculate_trip_plan(total_distance_km, current_cycle_used_hours):
    """
    Calculate trip plan based on FMCSA HOS rules with rolling 8-day cycle tracking.

    Rules:
    - Max 11 hours driving per day
    - Max 14-hour on-duty window
    - 30-minute break after 8 hours driving
    - 10 consecutive hours off-duty required
    - Rolling 8-day cycle: max 70 on-duty hours in any 8 consecutive days
    - Speed = 60 km/h
    - Pickup/drop time: 1 hour each (On Duty)

    If 70-hour cycle exceeded, force 34-hour restart and reset cycle.
    """
    AVG_SPEED = 60  # km/h
    MAX_DRIVING_PER_DAY = 11  # hours
    MAX_WORK_WINDOW = 14  # hours
    BREAK_AFTER = 8  # hours of driving
    BREAK_DURATION = 0.5  # hours (30 min)
    REST_HOURS = 10  # hours off-duty between days
    CYCLE_LIMIT = 70  # hours (70-hour/8-day rolling)
    RESTART_HOURS = 34  # hours for 34-hour restart
    PICKUP_HOURS = 1  # hour (On Duty)
    DROPOFF_HOURS = 1  # hour (On Duty)

    total_driving_hours = total_distance_km / AVG_SPEED

    days = []
    remaining_driving = total_driving_hours
    day_number = 1
    pickup_done = False
    dropoff_done = False

    # Rolling 8-day cycle: stores on-duty hours for last 8 days (maxlen=8 auto-evicts oldest)
    cycle_window = deque(maxlen=8)

    # Initialize cycle window with prior 7 days (current_cycle_used_hours = sum of 7 prior days)
    if current_cycle_used_hours > 0:
        prior_daily = current_cycle_used_hours / 7  # Assume equal distribution across 7 days
        for _ in range(7):
            cycle_window.append(prior_daily)

    while remaining_driving > 0:
        # Calculate driving hours for this day (max 11)
        driving_today = min(remaining_driving, MAX_DRIVING_PER_DAY)

        # Determine if break is needed
        break_needed = driving_today > BREAK_AFTER
        break_hours = BREAK_DURATION if break_needed else 0

        # Add pickup on first day, dropoff on last day
        pickup_today = PICKUP_HOURS if (not pickup_done and day_number == 1) else 0
        dropoff_today = DROPOFF_HOURS if (remaining_driving - driving_today <= 0) else 0

        # Calculate on-duty hours: pickup + driving + break + dropoff
        on_duty_today = pickup_today + driving_today + break_hours + dropoff_today

        # Ensure total on-duty time fits within 14-hour window
        if on_duty_today > MAX_WORK_WINDOW:
            # Reduce driving to fit within window
            available_for_driving = MAX_WORK_WINDOW - pickup_today - dropoff_today
            if break_needed:
                available_for_driving -= BREAK_DURATION
            driving_today = min(driving_today, available_for_driving)
            # Recalculate break and on-duty
            break_needed = driving_today > BREAK_AFTER
            break_hours = BREAK_DURATION if break_needed else 0
            # Recalculate dropoff (may have changed if driving reduced)
            dropoff_today = DROPOFF_HOURS if (remaining_driving - driving_today <= 0) else 0
            on_duty_today = pickup_today + driving_today + break_hours + dropoff_today

        # Check rolling 8-day cycle: simulate adding today's on-duty hours
        simulated_window = deque(cycle_window, maxlen=8)
        simulated_window.append(on_duty_today)
        cycle_after_today = sum(simulated_window)

        # If cycle exceeds 70 hours, trigger 34-hour restart across two days
        if cycle_after_today > CYCLE_LIMIT:
            # Day 1 of restart: 24 hours Sleeper Berth
            days.append({
                'day': day_number,
                'driving_hours': 0,
                'on_duty_hours': 0,
                'break_taken': False,
                'rest_hours': 24,
                'cycle_used_after_day': 0,
                'pickup': False,
                'dropoff': False
            })
            day_number += 1
            # Day 2 of restart: remaining 10 hours Sleeper Berth
            days.append({
                'day': day_number,
                'driving_hours': 0,
                'on_duty_hours': 0,
                'break_taken': False,
                'rest_hours': 10,
                'cycle_used_after_day': 0,
                'pickup': False,
                'dropoff': False
            })
            # Reset cycle after 34-hour restart
            cycle_window.clear()
            day_number += 1
            continue  # Retry this day after restart

        # Update cycle window with today's on-duty hours
        cycle_window.append(on_duty_today)

        # Mark pickup/dropoff as done
        if pickup_today > 0:
            pickup_done = True
        if dropoff_today > 0:
            dropoff_done = True

        # Update remaining driving
        remaining_driving -= driving_today

        # Determine rest hours for this day
        rest_hours_today = REST_HOURS if remaining_driving > 0 else 0

        # Current cycle usage is sum of last 8 days (rolling window)
        cycle_used_after_day = sum(cycle_window)

        days.append({
            'day': day_number,
            'driving_hours': round(driving_today, 2),
            'on_duty_hours': round(on_duty_today, 2),
            'break_taken': break_needed,
            'rest_hours': rest_hours_today,
            'cycle_used_after_day': round(cycle_used_after_day, 2),
            'pickup': pickup_today > 0,
            'dropoff': dropoff_today > 0
        })

        day_number += 1

    return {'days': days}


def generate_log_sheet(day_data, break_status="On Duty (Not Driving)"):
    """
    Generate a 24-hour log sheet for a given day.

    Args:
        day_data: Dict containing day info with keys:
            - driving_hours: number of hours driving
            - break_taken: boolean indicating if break was taken
            - rest_hours: hours of rest (typically 10, or 34 for restart)
            - pickup: boolean indicating if pickup happens this day
            - dropoff: boolean indicating if dropoff happens this day
        break_status: Status to use for breaks ("On Duty (Not Driving)" or "Off Duty")

    Returns:
        List of time slots with start, end, and status covering exactly 24 hours.
        Statuses: "Off Duty", "Sleeper Berth", "Driving", "On Duty (Not Driving)"
    """
    PICKUP_HOURS = 1
    DROPOFF_HOURS = 1
    BREAK_DURATION = 0.5

    driving_hours = day_data.get('driving_hours', 0)
    break_taken = day_data.get('break_taken', False)
    rest_hours = day_data.get('rest_hours', 0)
    pickup = day_data.get('pickup', False)
    dropoff = day_data.get('dropoff', False)

    log_sheet = []
    current_time = 0  # in hours, 0-24

    # Helper to format time
    def format_time(hours):
        hour = int(hours)
        minute = int((hours - hour) * 60)
        return f"{hour:02d}:{minute:02d}"

    # Helper to add time slot with start and end fields
    def add_slot(duration, status):
        nonlocal current_time
        start = current_time
        end = start + duration
        log_sheet.append({
            'start': format_time(start),
            'end': format_time(end),
            'status': status
        })
        current_time = end

    # 34-hour restart: split across days
    # Day 1: 24 hours Sleeper Berth, Day 2: 10 hours Sleeper Berth
    if rest_hours == 34:
        add_slot(24, "Sleeper Berth")
        return log_sheet

    # Rest period (Sleeper Berth) - cap at 24 hours for single day
    if rest_hours > 0:
        sleep_hours = min(rest_hours, 24 - current_time)
        add_slot(sleep_hours, "Sleeper Berth")

    # Pickup: 1 hour On Duty (Not Driving) - only on first day
    if pickup:
        add_slot(PICKUP_HOURS, "On Duty (Not Driving)")

    # Driving period with break if needed
    if driving_hours > 0:
        if break_taken:
            # Drive for 8 hours
            add_slot(8, "Driving")
            # 30 min break - use configurable status
            add_slot(BREAK_DURATION, break_status)
            # Remaining driving
            remaining = driving_hours - 8
            if remaining > 0:
                add_slot(remaining, "Driving")
        else:
            # Drive continuously
            add_slot(driving_hours, "Driving")

    # Dropoff: 1 hour On Duty (Not Driving) - only on last day
    if dropoff:
        add_slot(DROPOFF_HOURS, "On Duty (Not Driving)")

    # Fill remaining time with Off Duty
    if current_time < 24:
        add_slot(24 - current_time, "Off Duty")

    return log_sheet


def generate_log_sheets_for_restart(day_number_start):
    """
    Generate log sheets for a 34-hour restart spread across two days.

    Returns:
        List of (day_number, log_sheet) tuples
    """
    day1_data = {
        'day': day_number_start,
        'driving_hours': 0,
        'on_duty_hours': 0,
        'break_taken': False,
        'rest_hours': 24,
        'cycle_used_after_day': 0,
        'pickup': False,
        'dropoff': False
    }
    day2_data = {
        'day': day_number_start + 1,
        'driving_hours': 0,
        'on_duty_hours': 0,
        'break_taken': False,
        'rest_hours': 10,
        'cycle_used_after_day': 0,
        'pickup': False,
        'dropoff': False
    }
    return [
        (day_number_start, generate_log_sheet(day1_data)),
        (day_number_start + 1, generate_log_sheet(day2_data))
    ]


def validate_trip_plan(trip_plan):
    """
    Validate a trip plan against FMCSA HOS rules.

    Checks:
    - Each day's log sheet totals exactly 24 hours
    - Driving <= 11 hours per day
    - On-duty window <= 14 hours per day
    - Break taken after 8 hours of driving
    - No overlapping time slots in log sheets

    Args:
        trip_plan: Dict containing 'days' list with day data and log sheets

    Returns:
        Dict with 'valid' (bool) and 'errors' (list of error messages)
    """
    errors = []

    if not trip_plan or 'days' not in trip_plan:
        return {'valid': False, 'errors': ['Invalid trip plan data']}

    for day_data in trip_plan['days']:
        day_num = day_data.get('day', 'Unknown')
        driving_hours = day_data.get('driving_hours', 0)
        on_duty_hours = day_data.get('on_duty_hours', 0)
        break_taken = day_data.get('break_taken', False)
        log_sheet = day_data.get('log_sheet', [])

        # Check driving hours <= 11
        if driving_hours > 11:
            errors.append(f'Day {day_num}: Driving exceeds 11-hour limit ({driving_hours}h)')

        # Check on-duty window <= 14 hours
        if on_duty_hours > 14:
            errors.append(f'Day {day_num}: On-duty window exceeds 14-hour limit ({on_duty_hours}h)')

        # Check break after 8 hours driving
        if driving_hours > 8 and not break_taken:
            errors.append(f'Day {day_num}: Break required after 8 hours driving')

        # Validate log sheet if present
        if log_sheet:
            log_errors = _validate_log_sheet(log_sheet, day_num)
            errors.extend(log_errors)

    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


def _validate_log_sheet(log_sheet, day_num):
    """Validate a single day's log sheet."""
    errors = []

    def parse_time(time_str):
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours + minutes / 60
        except:
            return 0

    # Check total = 24 hours
    total_hours = 0
    time_slots = []

    for slot in log_sheet:
        start = parse_time(slot.get('start', '0:00'))
        end = parse_time(slot.get('end', '0:00'))
        duration = end - start
        total_hours += duration
        time_slots.append((start, end))

    if abs(total_hours - 24) > 0.01:  # Allow small floating point errors
        errors.append(f'Day {day_num}: Log sheet totals {total_hours:.2f} hours (must be 24)')

    # Check for overlaps
    time_slots.sort(key=lambda x: x[0])
    for i in range(len(time_slots) - 1):
        if time_slots[i][1] > time_slots[i+1][0]:
            errors.append(f'Day {day_num}: Time slots overlap')

    # Check coverage (0 to 24)
    if time_slots:
        if time_slots[0][0] > 0:
            errors.append(f'Day {day_num}: Log sheet does not start at 00:00')
        if time_slots[-1][1] < 24:
            errors.append(f'Day {day_num}: Log sheet does not cover full 24 hours')

    return errors
