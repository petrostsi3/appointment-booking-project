import apiClient from './api';


const APPOINTMENT_ENDPOINTS = {
  APPOINTMENTS: '/api/appointments/',
  AVAILABLE_SLOTS: '/api/appointments/available-slots/',
  MY_APPOINTMENTS: '/api/appointments/my_appointments/',
  CANCEL_APPOINTMENT: (appointmentId) => `/api/appointments/${appointmentId}/cancel/`,
};

const appointmentService = {
  getAllAppointments: async () => {
    const response = await apiClient.get(APPOINTMENT_ENDPOINTS.APPOINTMENTS);
    return response.data;
  },
  getMyAppointments: async () => {
    const response = await apiClient.get(APPOINTMENT_ENDPOINTS.MY_APPOINTMENTS);
    return response.data;
  },
  getAppointmentById: async (appointmentId) => {
    const response = await apiClient.get(`${APPOINTMENT_ENDPOINTS.APPOINTMENTS}${appointmentId}/`);
    return response.data;
  },
  bookAppointment: async (appointmentData) => {
    const response = await apiClient.post(APPOINTMENT_ENDPOINTS.APPOINTMENTS, appointmentData);
    return response.data;
  },
  updateAppointment: async (appointmentId, appointmentData) => {
    const response = await apiClient.patch(
      `${APPOINTMENT_ENDPOINTS.APPOINTMENTS}${appointmentId}/`, 
      appointmentData
    );
    return response.data;
  },
  cancelAppointment: async (appointmentId) => {
    const response = await apiClient.post(APPOINTMENT_ENDPOINTS.CANCEL_APPOINTMENT(appointmentId));
    return response.data;
  },
  getAvailableTimeSlots: async (businessId, serviceId, date) => {
    console.log('Requesting available slots:', { businessId, serviceId, date });
    const response = await apiClient.get(APPOINTMENT_ENDPOINTS.AVAILABLE_SLOTS, {
      params: { business_id: businessId, service_id: serviceId, date },
    });
    console.log('Available slots API response:', response.data);
    return response.data;
  },
};

export default appointmentService;