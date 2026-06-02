from .models import Notification, User


def create_notification(recipient, title, message, event_type):
    if not recipient:
        return None
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        event_type=event_type,
    )


def create_staff_notifications(title, message, event_type):
    recipients = User.objects.filter(
        role__in=[User.STAFF, User.ADMIN],
        is_active=True,
        deleted_at__isnull=True,
    )
    return [
        create_notification(recipient, title, message, event_type)
        for recipient in recipients
    ]
