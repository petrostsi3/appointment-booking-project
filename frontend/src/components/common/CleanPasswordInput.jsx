import React, { useState, useEffect } from 'react';
import { Form, ProgressBar } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


const CleanPasswordInput = ({ 
  password, 
  onPasswordChange, 
  username = '', 
  showRequirements = true,
  label = "Password",
  placeholder = "Enter your password",
  name = "password",
  required = true,
  className = "",
  checkPasswordStrength = null,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    is_valid: false,
    strength_score: 0,
    requirements: {
      min_length: false,
      has_uppercase: false,
      has_special: false,
      not_similar_to_username: true
    }
  });

  // Real-time password strength checking
  useEffect(() => {
    const checkStrength = async () => {
      if (password.length === 0) {
        setPasswordStrength({
          is_valid: false,
          strength_score: 0,
          requirements: {
            min_length: false,
            has_uppercase: false,
            has_special: false,
            not_similar_to_username: true
          }
        });
        return;
      }
      try {
        let result;
        
        // Use provided API function or fallback to local validation
        if (checkPasswordStrength && typeof checkPasswordStrength === 'function') {
          result = await checkPasswordStrength(password, username);
        } else {
          // Local validation fallback
          const requirements = {
            min_length: password.length >= 8,
            has_uppercase: /[A-Z]/.test(password),
            has_special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            not_similar_to_username: username ? !password.toLowerCase().includes(username.toLowerCase()) : true
          };

          const validCount = Object.values(requirements).filter(Boolean).length;
          result = {
            is_valid: validCount === 4,
            strength_score: (validCount / 4) * 100,
            requirements
          };
        }
        
        setPasswordStrength(result);
      } catch (error) {
        console.error('Password strength check failed:', error);
      }
    };

    const debounceTimer = setTimeout(checkStrength, 300);
    return () => clearTimeout(debounceTimer);
  }, [password, username, checkPasswordStrength]);

  const getStrengthColor = (score) => {
    if (score >= 100) return 'success';
    if (score >= 75) return 'info';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const getStrengthText = (score) => {
    if (score >= 100) return 'Strong';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Weak';
  };

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  const RequirementItem = ({ isValid, children }) => (
    <div className={`requirement-item ${isValid ? 'valid' : 'invalid'}`}>
      <span className="requirement-icon">
        {isValid ? '✓' : '✗'}
      </span>
      <span className="requirement-text">{children}</span>
    </div>
  );

  return (
    <div className={`clean-password-input ${className}`}>
      <Form.Group className="mb-3">
        <Form.Label>{label} {required && '*'}</Form.Label>
        <div className="password-input-wrapper">
          <Form.Control
            type={showPassword ? "text" : "password"}
            name={name}
            value={password}
            onChange={onPasswordChange}
            required={required}
            placeholder={placeholder}
            className="password-input"
            {...props}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={togglePasswordVisibility}
            onMouseDown={(e) => e.preventDefault()}
            onFocus={(e) => e.preventDefault()}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        
        {password.length > 0 && showRequirements && (
          <div className="password-feedback">
            {/* Strength indicator */}
            <div className="password-strength">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <small className="text-muted">Password strength:</small>
                <small className={`text-${getStrengthColor(passwordStrength.strength_score)}`}>
                  {getStrengthText(passwordStrength.strength_score)}
                </small>
              </div>
              <ProgressBar 
                now={passwordStrength.strength_score} 
                variant={getStrengthColor(passwordStrength.strength_score)}
                style={{ height: '6px' }}
              />
            </div>
            
            {/* Requirements checklist */}
            <div className="password-requirements">
              <RequirementItem isValid={passwordStrength.requirements.min_length}>
                At least 8 characters
              </RequirementItem>
              <RequirementItem isValid={passwordStrength.requirements.has_uppercase}>
                One uppercase letter
              </RequirementItem>
              <RequirementItem isValid={passwordStrength.requirements.has_special}>
                One special character (!@#$%^&*)
              </RequirementItem>
              {username && (
                <RequirementItem isValid={passwordStrength.requirements.not_similar_to_username}>
                  Different from username
                </RequirementItem>
              )}
            </div>
          </div>
        )}
      </Form.Group>

      <style jsx>{`
        .clean-password-input {
          position: relative;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input {
          padding-right: 50px !important;
        }

        /* FIX: stable button positioning */
        .password-toggle-btn {
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          width: 32px !important;
          height: 32px !important;
          
          /* Transform - NEVER CHANGES */
          transform: translateY(-50%) !important;
          
          /* Layout stability */
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          
          /* Visual */
          color: #6c757d !important;
          border-radius: 4px !important;
          z-index: 10 !important;
          
          /* Behavior */
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          
          /* Prevent all layout effects */
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          overflow: hidden !important;
          white-space: nowrap !important;
          
          /* Smooth transitions ONLY for visual properties */
          transition: color 0.15s ease, background-color 0.15s ease !important;
          
          /* SOS: Lock transform and position */
          will-change: color, background-color !important;
        }

        /* FOR ALL STATES: Keep exact same positioning */
        .password-toggle-btn:hover,
        .password-toggle-btn:focus,
        .password-toggle-btn:active,
        .password-toggle-btn:focus-visible,
        .password-toggle-btn:visited {
          /* DONT MOVE */
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 32px !important;
          height: 32px !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          
          color: #495057 !important;
          background: rgba(0, 0, 0, 0.05) !important;
          
          outline: none !important;
          box-shadow: none !important;
        }

        .password-toggle-btn:active {
          transform: translateY(-50%) !important;
          background: rgba(0, 0, 0, 0.1) !important;
          /* Prevent any "pressed" effect */
          box-shadow: none !important;
          border: 0 !important;
        }

        /* FIX: Prevent any user selection or interaction issues */
        .password-toggle-btn * {
          pointer-events: none !important;
          user-select: none !important;
        }

        .password-feedback {
          margin-top: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
          border: 1px solid rgba(0, 123, 255, 0.1);
        }

        .password-strength {
          margin-bottom: 16px;
        }

        .password-requirements {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        @media (max-width: 576px) {
          .password-requirements {
            grid-template-columns: 1fr;
          }
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          transition: all 0.2s ease;
        }

        .requirement-icon {
          font-weight: bold;
          font-size: 14px;
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }

        .requirement-text {
          font-size: 13px;
          font-weight: 500;
        }

        .requirement-item.valid .requirement-icon {
          color: #28a745;
        }

        .requirement-item.valid .requirement-text {
          color: #28a745;
        }

        .requirement-item.invalid .requirement-icon {
          color: #dc3545;
        }

        .requirement-item.invalid .requirement-text {
          color: #6c757d;
        }

        /* Focus states for accessibility */
        .password-input:focus {
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        /* Hover -> requirement items */
        .requirement-item.valid:hover {
          background-color: rgba(40, 167, 69, 0.1);
          border-radius: 4px;
          padding: 6px 8px;
          margin: -2px -4px;
        }

        /* FIX: Ensure button doesn't affect input field layout */
        .password-input:focus + .password-toggle-btn {
          color: #495057 !important;
        }
        
        .password-toggle-btn:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
          transform: translateY(-50%) !important;
        }
      `}</style>
    </div>
  );
};

export default CleanPasswordInput;