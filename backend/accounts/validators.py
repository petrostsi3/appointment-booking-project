import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class CustomPasswordValidator: 
    def validate(self, password, user=None):
        errors = []
        if len(password) < 8:
            errors.append(_("Password must contain at least 8 characters."))
        if not re.search(r'[A-Z]', password):
            errors.append(_("Password must contain at least one uppercase letter."))
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(
                _("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)."))
        if user:
            username = user.username.lower() if hasattr(user, 'username') else ''
            if username and username in password.lower():
                errors.append(
                    _("Password cannot contain your username. Please choose a different password."))
            if hasattr(user, 'is_password_reused') and user.is_password_reused(password):
                errors.append(
                    _("You cannot reuse your previous password. Please choose a different password."))
        if errors:
            raise ValidationError(errors)
    

    def get_help_text(self):
        return _(
            "Your password must contain at least 8 characters, "
            "including one uppercase letter and one special character.")


class PasswordReuseValidator:
    def validate(self, password, user=None):
        if user and hasattr(user, 'is_password_reused'):
            if user.is_password_reused(password):
                raise ValidationError(
                    _("You cannot reuse your previous password. Please choose a different password."),
                    code='password_reused')
    

    def get_help_text(self):
        return _("Your password cannot be the same as your previous password.")


class UsernamePasswordSimilarityValidator:
    def validate(self, password, user=None):
        if not user:
            return
        username = getattr(user, 'username', '')
        if not username:
            return
        if username.lower() in password.lower():
            raise ValidationError(
                _("Password cannot contain your username. Please choose a different password."),
                code='password_too_similar')
    

    def get_help_text(self):
        return _("Your password cannot contain your username.")


def validate_password_strength(password, username=None):
    result = {
        'is_valid': True,
        'errors': [],
        'strength_score': 0,
        'requirements': {
            'min_length': len(password) >= 8,
            'has_uppercase': bool(re.search(r'[A-Z]', password)),
            'has_special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
            'not_similar_to_username': True}}
    if not result['requirements']['min_length']:
        result['errors'].append("Password must contain at least 8 characters.")
        result['is_valid'] = False
    else:
        result['strength_score'] += 25
    if not result['requirements']['has_uppercase']:
        result['errors'].append("Password must contain at least one uppercase letter.")
        result['is_valid'] = False
    else:
        result['strength_score'] += 25
    if not result['requirements']['has_special']:
        result['errors'].append("Password must contain at least one special character.")
        result['is_valid'] = False
    else:
        result['strength_score'] += 25
    if username and username.lower() in password.lower():
        result['requirements']['not_similar_to_username'] = False
        result['errors'].append("Password cannot contain your username.")
        result['is_valid'] = False
    else:
        result['strength_score'] += 25
    return result