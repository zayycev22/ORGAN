from django import template

register = template.Library()

@register.filter(name='spaced')
def spaced(value):
    """
    Преобразует целое число в строку с пробелами между тысячами.
    25700 -> "25 700"
    """
    try:
        s = f"{int(value):,}"
        return s.replace(",", " ")
    except (ValueError, TypeError):
        return value
