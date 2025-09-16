import React from 'react';
import { Container } from 'react-bootstrap';


const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div>
            <h5>Appointment Booking System</h5>
            <p className="mb-2">Easy appointment scheduling for businesses and clients</p>
          </div>
          <div className="mt-3 mt-md-0">
            <p className="mb-0">© {currentYear} Appointment Booking. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;