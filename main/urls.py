from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name='home'),  # Главная с редиректом
    path('catalog/', views.catalog, name='catalog'),  # Основной каталог
    path('collections/', views.collections, name='collections'),  # Страница коллекций
    path('about/', views.about, name='about'),  # Страница "О нас"
    path('search/', views.search_items, name='search'),  # Поиск товаров
    path('catalog/<int:item_id>/', views.catalog_item_detail, name='catalog_item_detail'),
    path('collections/<int:collection_id>/', views.collection_detail, name='collection_detail'),
    # API endpoints
    path('api/catalog/filter/', views.catalog_filter_api, name='catalog_filter_api'),
    path('api/search/', views.search_api, name='search_api'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)