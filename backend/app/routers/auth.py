from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserResponse
from app.utils.security import create_access_token, hash_password, verify_password

# This router groups all authentication endpoints under the /api/auth prefix
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check for duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    # 2. Hash the password
    hashed_pwd = hash_password(user_in.password)
    
    # 3. Create and save the new user in the database
    new_user = User(
        email=user_in.email,
        password_hash=hashed_pwd,
        first_name=user_in.first_name,
        last_name=user_in.last_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Return safe user data (FastAPI uses UserResponse to strip the password_hash)
    return new_user



@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find the user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # 2. Same error for "no such email" and "wrong password"
    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create the token and return it
    return Token(access_token=create_access_token(user.id))