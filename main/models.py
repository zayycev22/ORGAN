from django.db import models

class HomePageImage(models.Model):
    image = models.ImageField(upload_to='home_page_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image uploaded at {self.uploaded_at}"


class Collection(models.Model):
    name = models.CharField("Название коллекции", max_length=255)
    year = models.PositiveIntegerField("Год коллекции")
    status = models.CharField("Статус коллекции (наличие)", max_length=255)
    description = models.TextField(
        verbose_name="Описание",
        blank=True,
        null=True,
        help_text="Многострочное описание коллекции"
    )
    def __str__(self):
        return f"{self.name} ({self.year})"

class CollectionImage(models.Model):
    collection = models.ForeignKey(Collection, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField("Фотография", upload_to='collections/')

    def __str__(self):
        return f"Изображение для {self.collection.name}"


class CatalogItem(models.Model):
    CATEGORY_CHOICES = [
        ('all', 'Все товары'),
        ('bracelets', 'Браслеты'),
        ('earrings', 'Серьги'),
        ('pendants', 'Кулоны'),
        ('necklaces', 'Ожерелья'),
        ('rings', 'Кольцо'),
    ]

    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to='catalog/')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='all')
    collection = models.ForeignKey(
        Collection,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Коллекция",
        related_name='items'
    )
    price = models.IntegerField(verbose_name="Цена (в рублях)")
    material = models.CharField(max_length=100, verbose_name="Материал")
    size = models.CharField(max_length=50, verbose_name="Размер")
    available_sizes = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Размеры кольца(для колец)",
        help_text="Список доступных размеров в формате JSON (например: [\"S\", \"M\", \"L\"])"
    )
    available = models.BooleanField(default=True, verbose_name="В наличии")
    description = models.TextField(
        verbose_name="Описание",
        blank=True,
        null=True,
        help_text="Многострочное описание товара"
    )

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

class ItemImage(models.Model):
    item = models.ForeignKey(CatalogItem, related_name='itemImages', on_delete=models.CASCADE)
    image = models.ImageField("Фотография", upload_to='itemImages/')

    def __str__(self):
        return f"Изображение для {self.item.title}"
