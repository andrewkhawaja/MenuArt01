from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
import os
from app.core.security import JWT_ALG

bearer = HTTPBearer()

def require_admin(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    token = creds.credentials
    secret = os.getenv("JWT_SECRET", "change-me-now")
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALG])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid token")
