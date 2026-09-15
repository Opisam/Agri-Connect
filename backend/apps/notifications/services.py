"""Service that creates in-app notifications for order events."""

from apps.marketplace.models import Order
from apps.notifications.models import Notification

ORDER_EVENT_ORDER_RECEIVED = "order_received"
ORDER_EVENT_ORDER_ACCEPTED = "order_accepted"
ORDER_EVENT_ORDER_REJECTED = "order_rejected"
ORDER_EVENT_ORDER_COMPLETED = "order_completed"


def notify_order_received(order: Order) -> None:
    """Notify the farmer when a buyer places an order on their listing."""
    _create(
        user=order.listing.farmer,
        notification_type=Notification.Types.ORDER_RECEIVED,
        title="New order received",
        message=(
            f"New order for {order.quantity} {order.listing.unit} of "
            f"{order.listing.product_name} placed by "
            f"{order.buyer.full_name or order.buyer.username}."
        ),
        order=order,
    )


def notify_order_accepted(order: Order) -> None:
    """Notify the buyer when their order is accepted."""
    _create(
        user=order.buyer,
        notification_type=Notification.Types.ORDER_ACCEPTED,
        title="Order accepted",
        message=(
            f"Your order for {order.quantity} {order.listing.unit} of "
            f"{order.listing.product_name} has been accepted."
        ),
        order=order,
    )


def notify_order_rejected(order: Order) -> None:
    """Notify the buyer when their order is rejected."""
    _create(
        user=order.buyer,
        notification_type=Notification.Types.ORDER_REJECTED,
        title="Order rejected",
        message=(
            f"Your order for {order.quantity} {order.listing.unit} of "
            f"{order.listing.product_name} was rejected."
        ),
        order=order,
    )


def notify_order_completed(order: Order) -> None:
    """Notify the buyer when their order is completed."""
    _create(
        user=order.buyer,
        notification_type=Notification.Types.ORDER_COMPLETED,
        title="Order completed",
        message=(
            f"Your order for {order.quantity} {order.listing.unit} of "
            f"{order.listing.product_name} is now completed."
        ),
        order=order,
    )


def notify_order_event(event: str, order: Order) -> None:
    """Dispatch an order event to the relevant notification creator."""
    handlers = {
        ORDER_EVENT_ORDER_RECEIVED: notify_order_received,
        ORDER_EVENT_ORDER_ACCEPTED: notify_order_accepted,
        ORDER_EVENT_ORDER_REJECTED: notify_order_rejected,
        ORDER_EVENT_ORDER_COMPLETED: notify_order_completed,
    }
    handler = handlers[event]
    handler(order)


def _create(user, notification_type: str, title: str, message: str, order: Order) -> None:
    """Persist a notification linked to an order."""
    Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        related_object_type="order",
        related_object_id=order.id,
    )
