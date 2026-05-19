from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from app.services.goalService import GoalService
from app.schemas.goalSchemas import GoalCreate, GoalOut

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/", response_model=list[GoalOut])
def get_goals(db: Session = Depends(get_db)):
    return GoalService(db).get_all()


@router.get("/progress")
def get_goals_progress(db: Session = Depends(get_db)):
    return GoalService(db).get_progress()


@router.get("/{goal_id}/progress")
def get_single_goal_progress(goal_id: str, db: Session = Depends(get_db)):
    return GoalService(db).get_single_progress(goal_id)


@router.post("/", response_model=GoalOut)
def add_goal(data: GoalCreate, db: Session = Depends(get_db)):
    return GoalService(db).add(data)


@router.delete("/{goal_id}")
def remove_goal(goal_id: str, db: Session = Depends(get_db)):
    GoalService(db).remove(goal_id)
    return {"ok": True}
