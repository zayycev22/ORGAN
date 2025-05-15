from django.contrib import admin
from .models import HomePageImage, CatalogItem
from .models import Collection, CollectionImage

# Регистрируем модель HomePageImage (один раз)
@admin.register(HomePageImage)
class HomePageImageAdmin(admin.ModelAdmin):
    list_display = ('image', 'uploaded_at')

# Используем декоратор для регистрации CatalogItem
@admin.register(CatalogItem)
class CatalogItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'category')  # Отображение полей в списке
    list_filter = ('category',)  # Фильтрация по категории




class CollectionImageInline(admin.TabularInline):  # Можно заменить на StackedInline для вертикального отображения
    model = CollectionImage
    extra = 1  # Количество пустых форм для добавления новых фото

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'year')
    inlines = [CollectionImageInline]

@admin.register(CollectionImage)
class CollectionImageAdmin(admin.ModelAdmin):
    list_display = ('collection', 'image')