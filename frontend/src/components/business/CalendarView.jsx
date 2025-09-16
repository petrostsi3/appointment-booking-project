import React, { useState } from 'react';
import { Button, Badge } from 'react-bootstrap';
import moment from 'moment';


const CalendarView = ({ appointments, onAppointmentClick, getStatusBadgeColor }) => {
  const [currentDate, setCurrentDate] = useState(moment());
  const appointmentsByDate = React.useMemo(() => {
    const grouped = {};
    appointments.forEach(appointment => {
      const dateKey = moment(appointment.date).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return grouped;
  }, [appointments]);
  const startOfMonth = currentDate.clone().startOf('month');
  const endOfMonth = currentDate.clone().endOf('month');
  const startOfCalendar = startOfMonth.clone().startOf('week');
  const endOfCalendar = endOfMonth.clone().endOf('week');
  const calendarDays = React.useMemo(() => {
    const days = [];
    let day = startOfCalendar.clone();
    while (day.isSameOrBefore(endOfCalendar, 'day')) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    return days;
  }, [startOfCalendar, endOfCalendar]);
  const goToPrevious = () => setCurrentDate(prev => prev.clone().subtract(1, 'month'));
  const goToNext = () => setCurrentDate(prev => prev.clone().add(1, 'month'));
  const goToToday = () => setCurrentDate(moment());
  const getBackgroundColor = (statusColor) => {
    const colors = {
      success: 'rgba(25, 135, 84, 0.1)',
      warning: 'rgba(255, 193, 7, 0.1)',
      danger: 'rgba(220, 53, 69, 0.1)',
      info: 'rgba(13, 202, 240, 0.1)',
      secondary: 'rgba(108, 117, 125, 0.1)'
    };
    return colors[statusColor] || colors.secondary;
  };
  const renderCalendarDay = (day) => {
    const dateKey = day.format('YYYY-MM-DD');
    const dayAppointments = appointmentsByDate[dateKey] || [];
    const isCurrentMonth = day.month() === currentDate.month();
    const isToday = day.isSame(moment(), 'day');
    return (
      <div 
        key={day.format('YYYY-MM-DD')} 
        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
        style={{
          minHeight: '100px',
          border: '1px solid #dee2e6',
          padding: '8px',
          backgroundColor: isToday ? '#e3f2fd' : isCurrentMonth ? 'white' : '#f8f9fa',
          borderColor: isToday ? '#2196f3' : '#dee2e6'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>{day.format('D')}</span>
          {dayAppointments.length > 0 && (
            <Badge bg="primary" style={{ fontSize: '10px', padding: '2px 6px' }}>
              {dayAppointments.length}
            </Badge>
          )}
        </div>
        
        <div style={{ maxHeight: '70px', overflowY: 'auto' }}>
          {dayAppointments.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50px', textAlign: 'center' }}>
              <span style={{ color: '#6c757d', fontSize: '11px' }}>No appointments</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {dayAppointments.slice(0, 2).map(appointment => (
                <div 
                  key={appointment.id}
                  onClick={() => onAppointmentClick(appointment)}
                  style={{
                    backgroundColor: getBackgroundColor(getStatusBadgeColor(appointment.status)),
                    borderLeft: `3px solid var(--bs-${getStatusBadgeColor(appointment.status)})`,
                    borderRadius: '4px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    lineHeight: '1.2'
                  }}
                >
                  <div>{appointment.start_time}</div>
                  <div>{appointment.client_details?.first_name}</div>
                </div>
              ))}
              {dayAppointments.length > 2 && (
                <div style={{ textAlign: 'center', padding: '2px', background: 'rgba(108, 117, 125, 0.1)', borderRadius: '2px', fontSize: '9px' }}>
                  +{dayAppointments.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline-primary" size="sm" onClick={goToPrevious}>‹</Button>
          <Button variant="outline-primary" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline-primary" size="sm" onClick={goToNext}>›</Button>
        </div>
        
        <h4 style={{ margin: 0 }}>{currentDate.format('MMMM YYYY')}</h4>
        
        <div>📅 Calendar View</div>
      </div>

      {/* Days of week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#495057', borderRight: '1px solid #dee2e6' }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0' }}>
        {calendarDays.map(renderCalendarDay)}
      </div>
    </div>
  );
};

export default CalendarView;