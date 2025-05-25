from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone
from Donors.models import Inventory
from Drivers.models import Deliveries
from NGO.models import Orders
from Main.models import User


def inventory_status(start, end):
    qs = Inventory.objects.filter(expiration_date__gte=start, expiration_date__lte=end)
    counts = qs.values('status').annotate(count=Count('inventory_id'))
    return [{'status':i['status'], 'label': Inventory.STATUS_TYPE[i['status']][1], 'count': i['count']} for i in counts]


def order_summary(start, end):
    qs = Orders.objects.filter(status__in=[Orders.PENDING,Orders.APPROVED,Orders.DELIVERED,Orders.CANCELLED,Orders.FAILED])
    counts = qs.values('status').annotate(count=Count('order_id'))
    return [{'status':i['status'], 'label': Orders.STATUS_TYPE[i['status']][1], 'count': i['count']} for i in counts]


def delivery_efficiency(start, end):
    complete = Deliveries.objects.filter(status=Deliveries.DELIVERED, pickup_time__isnull=False, delivery_time__isnull=False)
    duration = ExpressionWrapper(F('delivery_time') - F('pickup_time'), output_field=DurationField())
    avg = complete.annotate(delta=duration).aggregate(avg_seconds=Avg('delta'))['avg_seconds']
    return {'average_delivery_seconds': avg.total_seconds() if avg else None}


def user_activity(start, end):
    """
    Count orders per NGO between given dates.
    Returns list of dicts: { ngo_id, ngo_name, orders_count }.
    """
    from django.db.models import Count

    # Filter orders by generation timestamp
    qs = Orders.objects.filter(
        created_on__date__gte=start,
        created_on__date__lte=end
    ).select_related('ngo_id')

    counts = (
        qs.values('ngo_id', 'ngo_id__organization_name')
          .annotate(orders_count=Count('order_id'))
          .order_by('-orders_count')
    )

    return [
        {
            'ngo_id':   item['ngo_id'],
            'ngo_name': item['ngo_id__organization_name'],
            'orders_count': item['orders_count'],
        }
        for item in counts
    ]

