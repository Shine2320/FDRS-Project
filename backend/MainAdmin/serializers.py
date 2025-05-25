from rest_framework import serializers
from .models import Reports

class ReportsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ('batch_key','report_type','start_date','end_date','data','generated_at')
        read_only_fields = fields