from .models import Notification


def create_notification(recipient, title, message, event_type):
    if not recipient:
        return None
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        event_type=event_type,
    )
