from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Return the profile of the logged-in user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update first_name and/or last_name of the logged-in user."""
    # Only the fields the client actually sent
    changes = update.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user