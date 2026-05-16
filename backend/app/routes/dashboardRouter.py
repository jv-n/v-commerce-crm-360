from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.dashboardSchemas import DashboardMetricsOut, MapDataOut
from app.services.dashboardService import DashboardService
from database.database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetricsOut)
def get_dashboard_metrics(
    period_type: str = Query("month", description="2weeks | month | 3months | semester | year | custom"),
    start_date: str = Query("", description="YYYY-MM-DD — obrigatório quando period_type=custom"),
    end_date: str = Query("", description="YYYY-MM-DD — obrigatório quando period_type=custom"),
    db: Session = Depends(get_db),
):
    return DashboardService(db).get_metrics(
        period_type=period_type,
        start_date=start_date or None,
        end_date=end_date or None,
    )


@router.get("/map", response_model=MapDataOut)
def get_dashboard_map(
    view: str = Query("estados", description="estados | regioes"),
    period_type: str = Query("month"),
    start_date: str = Query(""),
    end_date: str = Query(""),
    db: Session = Depends(get_db),
):
    items = DashboardService(db).get_map_data(
        view=view,
        period_type=period_type,
        start_date=start_date or None,
        end_date=end_date or None,
    )
    return {"view": view, "items": items}
