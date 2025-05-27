import json

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import HomePageImage, CatalogItem, Collection, CollectionImage, ItemImage


def catalog_item_detail(request, item_id):
    """Страница с подробной информацией о товаре"""
    item = get_object_or_404(CatalogItem, id=item_id)
    images = item.itemImages.all()  # Только изображения для текущего товара
    if item.description is None:
        item.description = ""

    images = [item, *images]
    available_sizes_json = json.dumps(item.available_sizes or [])

    return render(request, 'catalog_item_detail.html', {
        'item': item,
        'images': images,
        'background_image': get_background_image(),
        'available_sizes_json': available_sizes_json,
    })

def collection_detail(request, collection_id):
    # Получаем саму коллекцию
    collection = get_object_or_404(Collection, id=collection_id)
    # Отдельным запросом тянем все её картинки
    images = CollectionImage.objects.filter(collection_id=collection_id)

    if collection.description is None:
        collection.description = ""
    return render(request, 'collection_detail.html', {
        'collection': collection,
        'images': images,
        'background_image': get_background_image(),
    })

def home(request):
    return render(request, 'home.html', {
        'background_image': get_background_image(),
    })


@require_GET
def catalog(request):
    """Страница каталога с фильтрацией по категориям"""
    context = {
        'background_image': get_background_image(),
        'collections': get_collections_with_images(),
    }

    # Обработка AJAX-запроса для фильтрации
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        category = request.GET.get('category', 'all')
        items = get_catalog_items(category)
        return JsonResponse({'items': serialize_items(items)})

    # Полноценный рендеринг страницы
    category_display = request.GET.get('category', 'все товары')
    context.update({
        'items': get_catalog_items(category_display),
        'category': category_display,
    })
    return render(request, 'catalog.html', context)


def collections(request):
    """
    Отображение страницы с коллекциями
    """
    # Получаем все коллекции с предзагруженными изображениями
    collections_list = Collection.objects.prefetch_related('images').all()

    return render(request, 'collections.html', {
        'collections': collections_list,
        'background_image': get_background_image(),  # Используем вспомогательную функцию
    })


def about(request):
    """
    Отображение страницы "О нас"
    """
    return render(request, 'about.html', {
        'background_image': get_background_image(),
    })


def search_api(request):
    """
    API для поиска товаров (JSON endpoint)
    """
    query = request.GET.get('query', '').strip()

    if not query:
        return JsonResponse({'items': []}, status=400)

    # Ищем товары, содержащие запрос в названии (регистронезависимо)
    items = CatalogItem.objects.filter(title__icontains=query)[:20]  # Лимит 20 результатов

    # Сериализуем результаты
    results = [{
        'title': item.title,
        'image_url': item.image.url,
        'category': item.get_category_display(),
        'id': item.id
    } for item in items]

    return JsonResponse({'items': results})


def catalog_filter_api(request):
    """
    API для фильтрации каталога (JSON endpoint)
    """
    # Маппинг категорий из URL в значения модели
    CATEGORY_MAP = {
        'all': 'all',
        'bracelets': 'bracelets',
        'earrings': 'earrings',
        'pendants': 'pendants',
        'necklaces': 'necklaces',
        'rings': 'rings',
    }

    category = request.GET.get('category', 'all')
    category_value = CATEGORY_MAP.get(category, 'all')

    # Фильтрация товаров
    if category_value == 'all':
        items = CatalogItem.objects.all()
    else:
        items = CatalogItem.objects.filter(category=category_value)

    # Сериализация результатов
    serialized_items = [{
        'title': item.title,
        'image_url': item.image.url,
        'category': item.get_category_display(),
        'id': item.id
    } for item in items]

    return JsonResponse({'items': serialized_items})


@require_GET
def search_items(request):
    """Поиск товаров (AJAX endpoint)"""
    query = request.GET.get('query', '').strip()
    if not query:
        return JsonResponse({'items': []})

    items = CatalogItem.objects.filter(title__icontains=query)[:20]  # Лимит результатов
    return JsonResponse({'items': serialize_items(items)})


# Вспомогательные функции
def get_background_image():
    """Получает фоновое изображение для страницы"""
    try:
        return HomePageImage.objects.latest('uploaded_at')
    except HomePageImage.DoesNotExist:
        return None


def get_collections_with_images():
    """Получает коллекции с предзагруженными изображениями"""
    return Collection.objects.prefetch_related('images').all()


def get_catalog_items(category_filter):
    """Фильтрует товары по категории"""
    category_map = {
        'все товары': 'all',
        'браслеты': 'bracelets',
        'серьги': 'earrings',
        'кулоны': 'pendants',
        'ожерелья': 'necklaces',
        'кольца': 'rings',
    }

    category = category_map.get(category_filter.lower(), 'all')

    if category == 'all':
        return CatalogItem.objects.all()
    return CatalogItem.objects.filter(category=category)


def serialize_items(items):
    """Сериализует товары для JSON-ответа"""
    return [{
        'title': item.title,
        'image': {'url': item.image.url},
        'category': item.get_category_display(),
    } for item in items]