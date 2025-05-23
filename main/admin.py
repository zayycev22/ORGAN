from django.contrib import admin
from django.utils.html import format_html
from .models import HomePageImage, CatalogItem, Collection, CollectionImage, ProductImage


# Регистрация модели HomePageImage
@admin.register(HomePageImage)
class HomePageImageAdmin(admin.ModelAdmin):
    list_display = ('image', 'uploaded_at')


# Регистрация модели CatalogItem с инлайнами для дополнительных изображений
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'order')
    ordering = ('order',)
    verbose_name = "Дополнительное изображение"
    verbose_name_plural = "Дополнительные изображения"


@admin.register(CatalogItem)
class CatalogItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'price', 'available', 'show_image')
    list_filter = ('category', 'available')
    search_fields = ('title', 'description', 'tags')
    inlines = [ProductImageInline]
    readonly_fields = ('show_image',)
    filter_horizontal = ('images',)  # если будешь использовать ManyToMany напрямую

    def show_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" />', obj.image.url)
        return "(нет изображения)"

    show_image.short_description = "Основное изображение"


# Регистрация модели ProductImage (для дополнительных фото товаров)
@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image', 'order', 'uploaded_at')
    list_filter = ('product',)
    search_fields = ('product__title',)
    readonly_fields = ('uploaded_at',)

    def has_module_permission(self, request):
        return True


# Регистрация модели Collection и её изображений
class CollectionImageInline(admin.TabularInline):
    model = CollectionImage
    extra = 1
    verbose_name = "Фото коллекции"
    verbose_name_plural = "Фотографии коллекции"


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'year', 'status')
    inlines = [CollectionImageInline]


@admin.register(CollectionImage)
class CollectionImageAdmin(admin.ModelAdmin):
    list_display = ('collection', 'image_preview')
    list_filter = ('collection',)
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" />', obj.image.url)
        return "(нет изображения)"

    image_preview.short_description = "Предпросмотр"