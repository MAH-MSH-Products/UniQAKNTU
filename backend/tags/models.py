from django.db import models

class TagCategory(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text="e.g., 'Subject', 'Chapter', 'Year'")
    
    class Meta:
        verbose_name_plural = "Tag Categories"

    def __str__(self):
        return self.name

class Tag(models.Model):
    category = models.ForeignKey(TagCategory, on_delete=models.CASCADE, related_name='tags')
    value = models.CharField(max_length=100, help_text="e.g., 'Operating Systems', '2024'")

    class Meta:
        unique_together = ('category', 'value')

    def __str__(self):
        return f"{self.category.name}: {self.value}"
