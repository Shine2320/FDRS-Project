from django.urls import path
from .views import BatchesView, GenerateReportsView, ReportDataView, ReportExportView

urlpatterns = [
    path('batches/', BatchesView.as_view()),
    path('generate/', GenerateReportsView.as_view()),
    path('<uuid:batch_key>/<str:report_name>/export/', ReportExportView.as_view()),
    path('<uuid:batch_key>/<str:report_name>/', ReportDataView.as_view()),
]
