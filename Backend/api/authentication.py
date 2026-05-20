"""
HAIRGURU - Custom Authentication
---------------------------------
CSRF-exempt session authentication for SPA frontends
running on a different port (e.g. localhost:3000 → localhost:8000).
"""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication subclass that skips CSRF validation.

    DRF's default SessionAuthentication enforces CSRF on all unsafe
    methods (POST, PUT, DELETE, PATCH). When the frontend is served
    from a different origin (port 3000) than the API (port 8000),
    the CSRF cookie is not automatically available, causing 403 errors.

    This class keeps session-based user identification but removes
    the CSRF requirement — appropriate for development and for APIs
    that use CORS to restrict access.
    """

    def enforce_csrf(self, request):
        return  # Skip CSRF check
