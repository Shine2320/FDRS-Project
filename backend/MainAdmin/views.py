import uuid
import csv
from datetime import timedelta
from io import StringIO

from django.http import HttpResponse
from django.db.models import Max
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Reports
from .serializers import ReportsSerializer
from .service import inventory_status, order_summary, delivery_efficiency, user_activity

class BatchesView(APIView):
    def get(self, request):
        # Annotate each batch_key with its max generated_at
        qs = (
            Reports.objects
                   .values('batch_key')
                   .annotate(generated_at=Max('generated_at'))
                   .order_by('-generated_at')
        )
        # qs now has one row per batch_key, with the latest timestamp
        return Response(list(qs), status=status.HTTP_200_OK)

class GenerateReportsView(APIView):
    """POST /api/reports/generate/"""
    def post(self, request):
        now = timezone.now().date()
        start = now - timedelta(days=7)
        end = now
        batch = timezone.now()  # use timestamp
        batch_key = uuid.uuid4()
        # generate each type except donation_summary
        for rtype, func in [
            (Reports.INVENTORY_STATUS, inventory_status),
            (Reports.ORDER_SUMMARY,    order_summary),
            (Reports.DELIVERY_EFFICIENCY, delivery_efficiency),
            (Reports.USER_ACTIVITY,    user_activity),
        ]:
            data = func(start, end)
            Reports.objects.create(
                batch_key=batch_key,
                generated_by=request.user,
                report_type=rtype,
                start_date=start,
                end_date=end,
                data=data,
                generated_at=timezone.now()
            )
        return Response({'batch_key': batch_key}, status=status.HTTP_201_CREATED)

class ReportDataView(APIView):
    """GET /api/reports/{batch_key}/{report_name}/"""
    mapping = {
        'inventory-status': Reports.INVENTORY_STATUS,
        'order-summary':    Reports.ORDER_SUMMARY,
        'delivery-efficiency': Reports.DELIVERY_EFFICIENCY,
        'user-activity':    Reports.USER_ACTIVITY,
    }

    def get(self, request, batch_key, report_name):
        if report_name not in self.mapping:
            return Response({'error':'Invalid report'}, status=status.HTTP_400_BAD_REQUEST)
        rtype = self.mapping[report_name]
        report = Reports.objects.filter(batch_key=batch_key, report_type=rtype).first()
        if not report:
            return Response({'error':'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(report.data, status=status.HTTP_200_OK)


class ReportExportView(APIView):
    mapping = ReportDataView.mapping

    def get(self, request, batch_key, report_name):
        if request.query_params.get("format", "csv") != "csv":
            return Response({'error':'Invalid export format'}, status=status.HTTP_400_BAD_REQUEST)
        if report_name not in self.mapping:
            return Response({'error':'Invalid report'}, status=status.HTTP_400_BAD_REQUEST)
        report = Reports.objects.filter(
            batch_key=batch_key,
            report_type=self.mapping[report_name],
        ).first()
        if not report:
            return Response({'error':'Not found'}, status=status.HTTP_404_NOT_FOUND)

        rows = report.data if isinstance(report.data, list) else [report.data]
        output = StringIO()
        if rows:
            fieldnames = sorted({key for row in rows for key in row.keys()})
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="{report_name}-{batch_key}.csv"'
        )
        return response
