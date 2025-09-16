import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaMobile, FaBell } from 'react-icons/fa';


const HomeScreen = () => {
	const { isAuthenticated, isClient, isBusiness, isAdmin, user } = useAuth();
	const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
	useEffect(() => {
		if (user && user.date_joined) {
			const joinDate = new Date(user.date_joined);
			const now = new Date();
			const hoursDifference = (now - joinDate) / (1000 * 60 * 60); 
			setIsFirstTimeUser(hoursDifference <= 24);
		}
	}, [user]);
	const renderHeroSection = () => (
		<div className="hero-section py-5 mb-5">
			<Container>
				<Row className="align-items-center min-vh-50">
					<Col lg={6} className="text-center text-lg-start">
						<h1 className="display-4 fw-bold mb-4">
							Simplify Your <span className="text-accent">Appointment</span> Booking
						</h1>
						<p className="lead mb-4 hero-subtitle">
							Connect businesses with clients through our intuitive appointment scheduling platform. 
							Save time, reduce no-shows, and grow your business.
						</p>
						<div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
							<Link to="/register">
								<Button className="btn-primary-custom" size="lg">
									Get Started
								</Button>
							</Link>
							<Link to="/businesses">
								<Button className="btn-outline-custom" size="lg">
									Browse Businesses
								</Button>
							</Link>
						</div>
					</Col>
					<Col lg={6} className="text-center mt-4 mt-lg-0">
						<div className="position-relative">
							<div className="hero-card">
								<FaCalendarAlt size={80} className="text-warning mb-3" />
								<h5>Smart Scheduling</h5>
								<p className="mb-0 hero-card-text">Book appointments in just a few clicks</p>
							</div>
						</div>
					</Col>
				</Row>
			</Container>
		</div>
	);

	const renderFeaturesSection = () => (
		<section className="py-5 mb-5">
			<Container>
				<div className="text-center mb-5">
					<h2 className="display-5 fw-bold mb-3">Why Choose Our Platform?</h2>
					<p className="lead text-muted">Everything you need to manage appointments efficiently</p>
				</div>
				
				<Row className="g-4">
					<Col md={4}>
						<div className="feature-card text-center">
							<div className="feature-icon">
								<FaClock size={40} />
							</div>
							<h5 className="mt-3 mb-3">24/7 Booking</h5>
							<p className="text-muted">
								Allow clients to book appointments anytime, anywhere. No more phone tag or missed opportunities.
							</p>
						</div>
					</Col>
					<Col md={4}>
						<div className="feature-card text-center">
							<div className="feature-icon">
								<FaBell size={40} />
							</div>
							<h5 className="mt-3 mb-3">Smart Reminders</h5>
							<p className="text-muted">
								Automated email reminders reduce no-shows by up to 80%. Keep your schedule full.
							</p>
						</div>
					</Col>
					<Col md={4}>
						<div className="feature-card text-center">
							<div className="feature-icon">
								<FaMobile size={40} />
							</div>
							<h5 className="mt-3 mb-3">Mobile Friendly</h5>
							<p className="text-muted">
								Fully responsive design works perfectly on all devices. Manage your business on the go.
							</p>
						</div>
					</Col>
				</Row>
			</Container>
		</section>
	);

	const renderHowItWorksSection = () => (
		<section className="how-it-works-section py-5 mb-5">
			<Container>
				<div className="text-center mb-5">
					<h2 className="display-5 fw-bold mb-3">How It Works</h2>
					<p className="lead text-muted">Get started in just 3 simple steps</p>
				</div>
				
				<Row className="g-4">
					<Col md={4}>
						<div className="step-card">
							<div className="step-number">1</div>
							<h5 className="mt-4 mb-3">Create Your Account</h5>
							<p className="text-muted">
								Sign up as a business owner or client. It takes less than 2 minutes to get started.
							</p>
						</div>
					</Col>
					<Col md={4}>
						<div className="step-card">
							<div className="step-number">2</div>
							<h5 className="mt-4 mb-3">Set Up Your Services</h5>
							<p className="text-muted">
								Add your services, set prices, and configure your availability. Make it easy for clients to book.
							</p>
						</div>
					</Col>
					<Col md={4}>
						<div className="step-card">
							<div className="step-number">3</div>
							<h5 className="mt-4 mb-3">Start Taking Bookings</h5>
							<p className="text-muted">
								Share your booking link and watch appointments roll in. Manage everything from one dashboard.
							</p>
						</div>
					</Col>
				</Row>
			</Container>
		</section>
	);

	const renderBenefitsSection = () => (
		<section className="benefits-section py-5 mb-5">
			<Container>
				<Row className="align-items-center">
					<Col lg={6}>
						<h2 className="display-5 fw-bold mb-4">
							Grow Your Business with Smart Scheduling
						</h2>
						<div className="benefit-list">
							<div className="benefit-item">
								<FaCheckCircle className="benefit-icon" />
								<div>
									<h6 className="mb-1">Reduce No-Shows</h6>
									<p className="text-muted mb-0">Automated reminders keep clients engaged</p>
								</div>
							</div>
							<div className="benefit-item">
								<FaCheckCircle className="benefit-icon" />
								<div>
									<h6 className="mb-1">Save Time</h6>
									<p className="text-muted mb-0">No more back-and-forth phone calls or emails</p>
								</div>
							</div>
							<div className="benefit-item">
								<FaCheckCircle className="benefit-icon" />
								<div>
									<h6 className="mb-1">Increase Revenue</h6>
									<p className="text-muted mb-0">Fill your calendar and maximize bookings</p>
								</div>
							</div>
							<div className="benefit-item">
								<FaCheckCircle className="benefit-icon" />
								<div>
									<h6 className="mb-1">Seamless Experience</h6>
									<p className="text-muted mb-0">Impress clients with seamless booking experience</p>
								</div>
							</div>
						</div>
					</Col>
					<Col lg={6} className="text-center mt-4 mt-lg-0">
						<div className="benefits-visual">
							<FaUsers size={120} className="text-primary opacity-75" />
						</div>
					</Col>
				</Row>
			</Container>
		</section>
	);

	const renderAuthenticatedContent = () => {
		const getWelcomeMessage = () => {
			if (isFirstTimeUser) {
				if (isClient) {
					return {
						title: `Welcome, ${user?.first_name || user?.username || 'New User'}! `,
						subtitle: "Thanks for joining us! You're all set to start booking appointments with local businesses."
					};
				} else if (isBusiness) {
					return {
						title: `Welcome to the platform, ${user?.first_name || user?.username || 'Business Owner'}! `,
						subtitle: "Let's get your business set up so clients can start booking appointments with you!"
					};
				} else if (isAdmin) {
					return {
						title: `Welcome, Administrator ${user?.first_name || user?.username}! 👨‍💼`,
						subtitle: "You now have full access to manage the appointment system."
					};
				}
			} else {
				return {
					title: `Welcome Back, ${user?.first_name || user?.username}!`,
					subtitle: "Ready to manage your appointments?"
				};
			}
		};

		const welcomeMsg = getWelcomeMessage();

		if (isClient) {
			return (
				<Container>
					<div className="welcome-section text-center py-5 mb-4">
						<h1 className="display-5 fw-bold mb-3 text-white">{welcomeMsg.title}</h1>
						<p className="lead mb-4 text-white opacity-90">{welcomeMsg.subtitle}</p>
						{isFirstTimeUser && (
							<div className="first-time-tips mb-4">
								<div className="simple-tip-card">
									<strong>💡 Quick Start:</strong> Browse businesses below to book your first appointment!
								</div>
							</div>
						)}
					</div>

					<Row className="g-4">
						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaCalendarAlt size={48} className="text-primary mb-3" />
									<h5 className="mb-3">Browse Businesses</h5>
									<p className="text-muted mb-4">Find and book appointments with local businesses and service providers.</p>
									<Link to="/businesses">
										<Button variant="primary" className="w-100">Browse Now</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>
						
						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaClock size={48} className="text-success mb-3" />
									<h5 className="mb-3">My Appointments</h5>
									<p className="text-muted mb-4">View, manage, and track all your upcoming and past appointments.</p>
									<Link to="/my-appointments">
										<Button variant="success" className="w-100">View Appointments</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>

						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaUsers size={48} className="text-info mb-3" />
									<h5 className="mb-3">Account Settings</h5>
									<p className="text-muted mb-4">Update your profile information and notification preferences.</p>
									<Link to="/profile">
										<Button variant="info" className="w-100">Manage Profile</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			);
		}

		if (isBusiness) {
			return (
				<Container>
					<div className="welcome-section text-center py-5 mb-4">
						<h1 className="display-5 fw-bold mb-3 text-white">{welcomeMsg.title}</h1>
						<p className="lead mb-4 text-white opacity-90">{welcomeMsg.subtitle}</p>
						{isFirstTimeUser && (
							<div className="first-time-tips mb-4">
								<div className="simple-tip-card">
									<strong>Next Steps:</strong> Set up your business profile and add your services!
								</div>
							</div>
						)}
						<div className="d-flex justify-content-center gap-3 flex-wrap">
							<Link to="/business/dashboard">
								<Button variant="light" size="lg" className="business-cta-btn">
									<strong>Go to Dashboard</strong>
								</Button>
							</Link>
							{!isFirstTimeUser && (
								<Link to="/business/create-appointment">
									<Button variant="outline-light" size="lg" className="business-cta-btn-outline">
										<strong>Create Appointment</strong>
									</Button>
								</Link>
							)}
						</div>
					</div>

					<Row className="g-4">
						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaCalendarAlt size={48} className="text-primary mb-3" />
									<h5 className="mb-3">{isFirstTimeUser ? 'Set Up Business' : 'Manage Appointments'}</h5>
									<p className="text-muted mb-4">
										{isFirstTimeUser ? 
											'Create your business profile and add your services to get started.' :
											'View, update, and track all your business appointments in one place.'
										}
									</p>
									<Link to={isFirstTimeUser ? "/business/profile" : "/business/appointments"}>
										<Button variant="primary" className="w-100">
											{isFirstTimeUser ? 'Set Up Now' : 'View Appointments'}
										</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>
						
						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaClock size={48} className="text-success mb-3" />
									<h5 className="mb-3">Business Settings</h5>
									<p className="text-muted mb-4">Manage your business profile, services, and operating hours.</p>
									<Link to="/business/profile">
										<Button variant="success" className="w-100">Manage Business</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>

						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaUsers size={48} className="text-info mb-3" />
									<h5 className="mb-3">Services & Hours</h5>
									<p className="text-muted mb-4">Set up your services, pricing, and business hours for optimal scheduling.</p>
									<Link to="/business/services">
										<Button variant="info" className="w-100">Manage Services</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			);
		}

		if (isAdmin) {
			return (
				<Container>
					<div className="welcome-section text-center py-5 mb-4">
						<h1 className="display-5 fw-bold mb-3 text-white">{welcomeMsg.title}</h1>
						<p className="lead mb-4 text-white opacity-90">{welcomeMsg.subtitle}</p>
						<Link to="/admin/dashboard">
							<Button variant="primary" size="lg">Go to Admin Dashboard</Button>
						</Link>
					</div>

					<Row className="g-4">
						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaCalendarAlt size={48} className="text-primary mb-3" />
									<h5 className="mb-3">System Overview</h5>
									<p className="text-muted mb-4">Monitor system performance, user activity, and overall statistics.</p>
									<Link to="/admin/dashboard">
										<Button variant="primary" className="w-100">View Dashboard</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>
						
						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaUsers size={48} className="text-success mb-3" />
									<h5 className="mb-3">User Management</h5>
									<p className="text-muted mb-4">Manage user accounts, permissions, and resolve user issues.</p>
									<Link to="/admin/users">
										<Button variant="success" className="w-100">Manage Users</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>

						<Col md={4}>
							<Card className="action-card h-100">
								<Card.Body className="text-center p-4">
									<FaClock size={48} className="text-info mb-3" />
									<h5 className="mb-3">Business Oversight</h5>
									<p className="text-muted mb-4">Review and manage registered businesses and their activities.</p>
									<Link to="/admin/businesses">
										<Button variant="info" className="w-100">Manage Businesses</Button>
									</Link>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			);
		}
	};

	return (
		<div className="home-screen">
			{!isAuthenticated ? (
				<>
					{renderHeroSection()}
					{renderFeaturesSection()}
					{renderHowItWorksSection()}
					{renderBenefitsSection()}
				</>
			) : (
				renderAuthenticatedContent()
			)}

			{/*custom CSS styles */}
			<style jsx>{`
				.home-screen {
					min-height: 100vh;
				}

				.hero-section {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 20px;
					color: white;
					margin: 20px 0;
					position: relative;
					overflow: hidden;
				}

				.hero-section::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="1" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
					pointer-events: none;
				}

				.text-accent {
					color: #FFD700;
				}

				.hero-subtitle {
					opacity: 0.9;
				}

				.btn-primary-custom {
					background: #FFD700;
					border: none;
					color: #333;
					font-weight: 600;
					padding: 12px 30px;
					border-radius: 50px;
					transition: all 0.3s ease;
				}

				.btn-primary-custom:hover {
					background: #FFC107;
					transform: translateY(-2px);
					box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
				}

				.btn-outline-custom {
					background: transparent;
					border: 2px solid rgba(255, 255, 255, 0.8);
					color: white;
					font-weight: 600;
					padding: 12px 30px;
					border-radius: 50px;
					transition: all 0.3s ease;
				}

				.btn-outline-custom:hover {
					background: white;
					color: #667eea;
					transform: translateY(-2px);
					box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
				}

				.hero-card {
					background: rgba(255, 255, 255, 0.1);
					backdrop-filter: blur(10px);
					border: 1px solid rgba(255, 255, 255, 0.2);
					border-radius: 20px;
					padding: 30px;
					transition: all 0.3s ease;
				}

				.hero-card:hover {
					transform: translateY(-10px);
					box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
				}

				.hero-card-text {
					opacity: 0.9;
				}

				.feature-card {
					background: white;
					padding: 40px 30px;
					border-radius: 15px;
					box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
					transition: all 0.3s ease;
					height: 100%;
				}

				.feature-card:hover {
					transform: translateY(-10px);
					box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
				}

				.feature-icon {
					width: 80px;
					height: 80px;
					border-radius: 50%;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					margin: 0 auto;
					color: white;
				}

				.how-it-works-section {
					background: #f8f9fa;
					border-radius: 20px;
					margin: 20px 0;
				}

				.step-card {
					text-align: center;
					padding: 30px 20px;
				}

				.step-number {
					width: 60px;
					height: 60px;
					border-radius: 50%;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 24px;
					font-weight: bold;
					margin: 0 auto;
					box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
				}


				.benefits-section {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				border-radius: 20px;
				color: white;
				margin: 20px 0;
				position: relative;
				overflow: hidden;
				}

				.benefits-section::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="1" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
				pointer-events: none;
				}

				.benefits-section h2 {
				position: relative;
				z-index: 1;
				}

				.benefit-item {
				position: relative;
				z-index: 1;
				}

				.benefit-icon {
				color: #FFD700 !important;
				}

				.benefits-visual {
				background: rgba(255, 255, 255, 0.1);
				backdrop-filter: blur(10px);
				border-radius: 20px;
				padding: 40px;
				border: 1px solid rgba(255, 255, 255, 0.2);
				position: relative;
				z-index: 1;
				}


				.welcome-section {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 20px;
					color: white;
					margin: 20px 0;
				}

				.simple-tip-card {
					background: rgba(255, 255, 255, 0.9);
					border-radius: 10px;
					padding: 15px 20px;
					color: #333;
					font-size: 16px;
					max-width: 500px;
					margin: 0 auto;
					box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
				}

				.first-time-tips {
					max-width: 600px;
					margin: 0 auto;
				}

				.business-cta-btn {
					background: white !important;
					color: #667eea !important;
					border: 2px solid white !important;
					font-weight: 600 !important;
					padding: 12px 30px !important;
					border-radius: 50px !important;
					box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3) !important;
					transition: all 0.3s ease !important;
				}

				.business-cta-btn:hover {
					background: #f8f9fa !important;
					color: #495057 !important;
					transform: translateY(-2px) !important;
					box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4) !important;
				}

				.business-cta-btn-outline {
					background: transparent !important;
					color: white !important;
					border: 2px solid rgba(255, 255, 255, 0.8) !important;
					font-weight: 600 !important;
					padding: 12px 30px !important;
					border-radius: 50px !important;
					transition: all 0.3s ease !important;
				}

				.business-cta-btn-outline:hover {
					background: rgba(255, 255, 255, 0.1) !important;
					color: white !important;
					border-color: white !important;
					transform: translateY(-2px) !important;
					box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2) !important;
				}

				.action-card {
					border: none;
					border-radius: 15px;
					box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
					transition: all 0.3s ease;
				}

				.action-card:hover {
					transform: translateY(-10px);
					box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
				}

				@media (max-width: 768px) {
					.hero-section {
						margin: 10px 0;
						border-radius: 15px;
					}
					
					.how-it-works-section,
					.benefits-section {
						margin: 10px 0;
						border-radius: 15px;
					}
					
					.step-card,
					.feature-card {
						padding: 20px;
					}
				}
			`}</style>
		</div>
	);
};

export default HomeScreen;