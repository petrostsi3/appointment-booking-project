# Appointment Booking System

## Copyright & Usage Notice
**© 2025 Petros Tsitsonis. All rights reserved.**

*This project is for demonstration purposes only. All code and intellectual property are owned by the author. Commercial use, modification, or distribution requires written permission.*


## What This Project Actually Does

This is basically a web app where businesses can let customers book appointments online. Think of it like when you book a haircut or doctor's visit online, but for any kind of business.

The whole system has two main parts:
- **Backend**: A Django/Python API that handles all the data and business logic
- **Frontend**: A React app that users actually see and interact with

## Why I Built This Project

I wanted to solve a real problem that small businesses face - managing appointments manually is a pain. This system lets them:
- Set up their services and pricing
- Let customers book online 24/7
- Manage their schedule without the back-and-forth phone calls
- Track business analytics

## Tech Stack 

**Backend:**
- Django & Django REST Framework (Python)
- PostgreSQL database
- JWT authentication
- Email notifications

**Frontend:**
- React.js 
- Bootstrap for styling 
- Axios for API calls
- React Router for navigation

## How to Actually Run This Thing

### Prerequisites
You'll need these installed:
- Python 3.8+
- Node.js 14+
- Git

### Backend Setup

1. **Clone and navigate to the project:**
   ```bash
   git clone https://github.com/petrostsi3/appointment-booking-project
   cd appointment_system
   ```

2. **Set up a virtual environment (seriously, do this):**
   ```bash
   python -m venv venv
   venv\Scripts\activate # On Windows
   ```

3. **Navigate to backend folder and install Python packages:**
   ```bash
   cd backend 
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser (admin account):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the backend server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend 
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

Now you should have:
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`

## Key Features

### For Business Owners:
- **Profile Management**: Set up business info, upload photos/logos, add descriptions
- **Service Management**: Add services with pricing and duration
- **Schedule Management**: Set business hours, block off time
- **Appointment Tracking**: See all bookings, confirm/cancel appointments
- **Analytics**: Basic stats on bookings and revenue

### For Customers:
- **Browse Services**: Find businesses and see what they offer
- **Easy Booking**: Pick a service, choose time, book instantly
- **Profile Management**: Save info for faster bookings
- **Appointment History**: See past and upcoming appointments

### Admin Features:
- **User Management**: Handle user accounts and permissions
- **Business Approval**: Review and approve new business registrations
- **System Monitoring**: Basic admin dashboard

## Database Structure (High Level)

The main models are:
- **Users**: Customers, business owners, and admins
- **Businesses**: Business profiles and info
- **Services**: What businesses offer
- **Appointments**: The actual bookings
- **Categories**: Business types (barberhop, salon, etc.)
- **Business Hours**: When businesses are open

## API Documentation

The backend exposes a RESTful API. Main endpoints:

- `/api/auth/` - Authentication (login, register, password reset)
- `/api/businesses/` - Business management
- `/api/appointments/` - Appointment booking and management
- `/api/users/` - User profiles and settings


## Future Improvements
- Mobile app
- Advanced analytics