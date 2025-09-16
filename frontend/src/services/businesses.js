import apiClient from './api';


const BUSINESS_ENDPOINTS = {
  BUSINESSES: '/api/businesses/',
  MY_BUSINESSES: '/api/businesses/my_businesses/',
  BUSINESS_HOURS: (businessId) => `/api/businesses/${businessId}/hours/`,
  BUSINESS_HOURS_BULK: (businessId) => `/api/businesses/${businessId}/hours/bulk_update/`,
  SERVICES: (businessId) => `/api/businesses/${businessId}/services/`,
  CATEGORIES: '/api/businesses/categories/'
};

const businessService = {
  getAllCategories: async () => {
    try {
      console.log('BusinessService: Fetching categories...');
      const response = await apiClient.get(BUSINESS_ENDPOINTS.CATEGORIES);
      console.log('BusinessService: Categories response:', response.data);
      let categoriesData;
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        categoriesData = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        categoriesData = [response.data];
      } else {
        console.warn('BusinessService: Unexpected categories format:', response.data);
        categoriesData = [];
      }
      console.log('BusinessService: Processed categories:', categoriesData);
      return categoriesData;
    } catch (error) {
      console.error('BusinessService: Error fetching categories:', error);
      console.error('BusinessService: Error response:', error.response?.data);
      throw error;
    }
  },

  getAllBusinesses: async () => {
    try {
      console.log('BusinessService: Fetching all businesses...');
      const response = await apiClient.get(BUSINESS_ENDPOINTS.BUSINESSES);
      console.log('BusinessService: Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error fetching all businesses:', error);
      throw error;
    }
  },

  getMyBusinesses: async () => {
    try {
      console.log('BusinessService: Fetching my businesses...');
      const allBusinesses = await businessService.getAllBusinesses();
      console.log('BusinessService: All businesses response:', allBusinesses);
      // FIX: Handle both array and paginated object responses
      let businessesArray;
      if (Array.isArray(allBusinesses)) {
        businessesArray = allBusinesses;
      } else if (allBusinesses && Array.isArray(allBusinesses.results)) {
        businessesArray = allBusinesses.results;
      } else if (allBusinesses && typeof allBusinesses === 'object') {
        // Single business object - wrap in array
        businessesArray = [allBusinesses];
      } else {
        console.warn('BusinessService: Unexpected response format:', allBusinesses);
        businessesArray = [];
      }
      console.log('BusinessService: Processed businesses array:', businessesArray);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('BusinessService: Current user:', user);
      const myBusinesses = businessesArray.filter(business => 
        business.owner === user.id || String(business.owner) === String(user.id)
      );
      console.log('BusinessService: My businesses:', myBusinesses);
      return myBusinesses;
    } catch (error) {
      console.error('BusinessService: Error fetching my businesses:', error);
      throw error;
    }
  },
  
  getBusinessById: async (businessId) => {
    try {
      const response = await apiClient.get(`${BUSINESS_ENDPOINTS.BUSINESSES}${businessId}/`);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error fetching business by ID:', error);
      throw error;
    }
  },
  
  // FIX: Create business with file upload support
  createBusiness: async (businessData) => {
    try {
      console.log('BusinessService: Creating business with data:', businessData);
      let config = {};
      if (businessData instanceof FormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data',
        };
      }
      const response = await apiClient.post(BUSINESS_ENDPOINTS.BUSINESSES, businessData, config);
      console.log('BusinessService: Business created:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error creating business:', error);
      console.error('BusinessService: Error response:', error.response?.data);
      throw error;
    }
  },
  
  // FIX: Update business with file upload support
  updateBusiness: async (businessId, businessData) => {
    try {
      console.log('BusinessService: Updating business:', businessId, businessData);
      let config = {};
      if (businessData instanceof FormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data',
        };
      }
      const response = await apiClient.patch(`${BUSINESS_ENDPOINTS.BUSINESSES}${businessId}/`, businessData, config);
      console.log('BusinessService: Business updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error updating business:', error);
      console.error('BusinessService: Error response:', error.response?.data);
      throw error;
    }
  },
  
  deleteBusiness: async (businessId) => {
    try {
      await apiClient.delete(`${BUSINESS_ENDPOINTS.BUSINESSES}${businessId}/`);
      return true;
    } catch (error) {
      console.error('BusinessService: Error deleting business:', error);
      throw error;
    }
  },
  
  getBusinessHours: async (businessId) => {
    try {
      console.log('BusinessService: Fetching business hours for business:', businessId);
      const response = await apiClient.get(BUSINESS_ENDPOINTS.BUSINESS_HOURS(businessId));
      console.log('BusinessService: Business hours response:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error fetching business hours:', error);
      throw error;
    }
  },
  
  bulkUpdateBusinessHours: async (businessId, hoursData) => {
    try {
      console.log('BusinessService: Bulk updating business hours for business:', businessId);
      console.log('BusinessService: Hours data:', hoursData);
      const response = await apiClient.post(
        BUSINESS_ENDPOINTS.BUSINESS_HOURS_BULK(businessId), 
        { business_hours: hoursData }
      );
      console.log('BusinessService: Bulk update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error bulk updating business hours:', error);
      throw error;
    }
  },
  
  updateBusinessHours: async (businessId, dayId, hoursData) => {
    try {
      console.log('BusinessService: Updating business hours:', { businessId, dayId, hoursData });
      let response;
      if (dayId) {
        response = await apiClient.patch(`${BUSINESS_ENDPOINTS.BUSINESS_HOURS(businessId)}${dayId}/`, hoursData);
      } else {
        response = await apiClient.post(BUSINESS_ENDPOINTS.BUSINESS_HOURS(businessId), hoursData);
      }
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error updating business hours:', error);
      throw error;
    }
  },

  addTimePeriod: async (businessId, businessHoursId, periodData) => {
    try {
      console.log('BusinessService: Adding time period:', { businessId, businessHoursId, periodData });
      const response = await apiClient.post(
        `${BUSINESS_ENDPOINTS.BUSINESS_HOURS(businessId)}${businessHoursId}/add_time_period/`,
        periodData
      );
      console.log('BusinessService: Time period added:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error adding time period:', error);
      throw error;
    }
  },
  
  removeTimePeriod: async (businessId, businessHoursId, periodId) => {
    try {
      console.log('BusinessService: Removing time period:', { businessId, businessHoursId, periodId });
      const response = await apiClient.delete(
        `${BUSINESS_ENDPOINTS.BUSINESS_HOURS(businessId)}${businessHoursId}/remove_time_period/?period_id=${periodId}`
      );
      console.log('BusinessService: Time period removed:', response.data);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error removing time period:', error);
      throw error;
    }
  },
  
  
  getBusinessServices: async (businessId) => {
    try {
      const response = await apiClient.get(BUSINESS_ENDPOINTS.SERVICES(businessId));
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error fetching business services:', error);
      throw error;
    }
  },
  
  createService: async (businessId, serviceData) => {
    try {
      const response = await apiClient.post(BUSINESS_ENDPOINTS.SERVICES(businessId), serviceData);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error creating service:', error);
      throw error;
    }
  },
  
  updateService: async (businessId, serviceId, serviceData) => {
    try {
      const response = await apiClient.patch(`${BUSINESS_ENDPOINTS.SERVICES(businessId)}${serviceId}/`, serviceData);
      return response.data;
    } catch (error) {
      console.error('BusinessService: Error updating service:', error);
      throw error;
    }
  },
  
  deleteService: async (businessId, serviceId) => {
    try {
      await apiClient.delete(`${BUSINESS_ENDPOINTS.SERVICES(businessId)}${serviceId}/`);
      return true;
    } catch (error) {
      console.error('BusinessService: Error deleting service:', error);
      throw error;
    }
  },
};

export default businessService;