import apiClient from './api';

const categoryService = {
  getAllCategories: async () => {
    try {
      console.log('CategoryService: Fetching all categories...');
      const response = await apiClient.get('/api/businesses/categories/');
      console.log('CategoryService: Raw response:', response.data);
      let categoriesData;
      if (Array.isArray(response.data)) {
        // Direct array response
        categoriesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        // Paginated response object
        categoriesData = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        // Single category object - wrap in array
        categoriesData = [response.data];
      } else {
        // Fallback to empty array
        console.warn('CategoryService: Unexpected response format:', response.data);
        categoriesData = [];
      }
      const validCategories = categoriesData.filter(category => {
        const isValid = category && category.id && category.name;
        if (!isValid) {
          console.warn('CategoryService: Invalid category found:', category);
        }
        return isValid;
      });
      const processedCategories = validCategories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        slug: category.slug || '',
        icon_class: category.icon_class || 'fas fa-store',
        color: category.color || '#007bff',
        ...category}));
      console.log('CategoryService: Processed categories:', processedCategories);
      return processedCategories;
    } catch (error) {
      console.error('CategoryService: Error fetching categories:', error);
      console.error('CategoryService: Error response:', error.response?.data);
      console.error('CategoryService: Error status:', error.response?.status);
      if (error.response?.status === 404) {
        throw new Error('Categories endpoint not found. Please check if the backend categories API is properly configured.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error while fetching categories. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error while fetching categories. Please check your connection.');
      } else {
        throw new Error(`Failed to fetch categories: ${error.response?.data?.detail || error.message}`);
      }
    }
  },

  getBusinessesByCategory: async (categoryId, searchTerm = '') => {
    try {
      console.log('CategoryService: Fetching businesses for category:', categoryId);
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await apiClient.get(`/api/businesses/categories/${categoryId}/businesses/`, {
        params
      });
      console.log('CategoryService: Businesses by category response:', response.data);
      return response.data;
    } catch (error) {
      console.error('CategoryService: Error fetching businesses by category:', error);
      throw error;
    }
  },

  getBusinessesGroupedByCategory: async () => {
    try {
      console.log('CategoryService: Fetching businesses grouped by category...');
      const response = await apiClient.get('/api/businesses/by_category/');
      console.log('CategoryService: Grouped businesses response:', response.data);
      return response.data;
    } catch (error) {
      console.error('CategoryService: Error fetching businesses by category:', error);
      throw error;
    }
  },

  getFeaturedBusinesses: async () => {
    try {
      console.log('CategoryService: Fetching featured businesses...');
      const response = await apiClient.get('/api/businesses/featured/');
      console.log('CategoryService: Featured businesses response:', response.data);
      return response.data;
    } catch (error) {
      console.error('CategoryService: Error fetching featured businesses:', error);
      throw error;
    }
  },

  requestCategory: async (requestData) => {
    try {
      console.log('CategoryService: Submitting category request:', requestData);
      const response = await apiClient.post('/api/businesses/request_category/', requestData);
      console.log('CategoryService: Category request submitted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('CategoryService: Error submitting category request:', error);
      throw error;
    }
  },

  getCategoryById: async (categoryId) => {
    try {
      console.log('CategoryService: Fetching category by ID:', categoryId);
      const response = await apiClient.get(`/api/businesses/categories/${categoryId}/`);
      console.log('CategoryService: Category by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('CategoryService: Error fetching category by ID:', error);
      throw error;
    }
  },

  searchCategories: async (searchTerm) => {
    try {
      console.log('CategoryService: Searching categories with term:', searchTerm);
      const response = await apiClient.get('/api/businesses/categories/', {
        params: { search: searchTerm }
      });
      let categoriesData;
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        categoriesData = response.data.results;
      } else {
        categoriesData = [];
      }
      console.log('CategoryService: Search results:', categoriesData);
      return categoriesData;
    } catch (error) {
      console.error('CategoryService: Error searching categories:', error);
      throw error;
    }
  }
};

export default categoryService;