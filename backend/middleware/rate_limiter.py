# ===============================================================
# FILE: middleware/rate_limiter.py
# PURPOSE: Shared SlowAPI rate limiter.
#          Routes can import `limiter` and apply limits with
#          @limiter.limit("30/minute").
# ===============================================================

from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(key_func=get_remote_address)
