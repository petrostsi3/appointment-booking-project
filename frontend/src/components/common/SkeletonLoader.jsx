import React from 'react';


export const BusinessCardSkeleton = () => (
  <div className="card h-100 shadow-sm">
    <div className="skeleton-image"></div>
    <div className="card-body">
      <div className="skeleton-title mb-3"></div>
      <div className="skeleton-text mb-2"></div>
      <div className="skeleton-text mb-2" style={{ width: '80%' }}></div>
      <div className="skeleton-text mb-3" style={{ width: '60%' }}></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

export const AppointmentCardSkeleton = () => (
  <div className="card mb-3 shadow-sm">
    <div className="card-body">
      <div className="row">
        <div className="col-md-8">
          <div className="skeleton-title mb-2"></div>
          <div className="skeleton-text mb-2"></div>
          <div className="skeleton-text mb-2" style={{ width: '70%' }}></div>
          <div className="skeleton-text" style={{ width: '50%' }}></div>
        </div>
        <div className="col-md-4 text-end">
          <div className="skeleton-badge mb-3"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  </div>
);

export const ProfileFormSkeleton = () => (
  <div className="card shadow-sm">
    <div className="card-header">
      <div className="skeleton-title" style={{ width: '200px' }}></div>
    </div>
    <div className="card-body">
      <div className="row">
        <div className="col-md-6">
          <div className="skeleton-form-group"></div>
        </div>
        <div className="col-md-6">
          <div className="skeleton-form-group"></div>
        </div>
      </div>
      <div className="skeleton-form-group"></div>
      <div className="skeleton-form-group"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// TODO: Add this CSS to global.css
const SkeletonCSS = `
.skeleton-title {
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-text {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-image {
  height: 150px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-button {
  height: 38px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 6px;
}

.skeleton-badge {
  height: 20px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 12px;
  margin-left: auto;
}

.skeleton-form-group {
  margin-bottom: 1rem;
}

.skeleton-form-group::before {
  content: '';
  display: block;
  height: 14px;
  width: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-form-group::after {
  content: '';
  display: block;
  height: 38px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 6px;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

export { SkeletonCSS };