package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import org.tonghua.app.data.model.Product
import org.tonghua.app.ui.theme.*
import org.tonghua.app.viewmodel.ShopViewModel

/**
 * Shop screen showing sustainable fashion products in a grid.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShopScreen(
    onProductClick: (String) -> Unit,
    viewModel: ShopViewModel = hiltViewModel(),
) {
    val shopState by viewModel.shopState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "03",
                style = MaterialTheme.typography.labelLarge,
                color = DeepSepia,
            )
            Text(
                text = "Shop",
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Sustainable fashion with a purpose",
                style = MaterialTheme.typography.bodyMedium,
                color = SlateGray,
            )
        }

        // Category filter chips
        CategoryFilterRow(
            selectedCategory = shopState.selectedCategory,
            onCategorySelected = { viewModel.selectCategory(it) },
        )

        // Product Grid
        if (shopState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = DeepSepia)
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(shopState.products) { product ->
                    ProductCard(
                        product = product,
                        onClick = { onProductClick(product.id) },
                    )
                }
            }
        }

        // Error
        shopState.error?.let { error ->
            Text(
                text = error,
                color = ErrorRed,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(16.dp),
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CategoryFilterRow(
    selectedCategory: String?,
    onCategorySelected: (String?) -> Unit,
) {
    val categories = listOf("All", "Bags", "Clothing", "Accessories", "Home")

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        categories.forEach { category ->
            val isSelected = (category == "All" && selectedCategory == null) ||
                    category.lowercase() == selectedCategory

            FilterChip(
                selected = isSelected,
                onClick = {
                    onCategorySelected(if (category == "All") null else category.lowercase())
                },
                label = {
                    Text(
                        text = category,
                        style = MaterialTheme.typography.labelMedium,
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = DeepSepia.copy(alpha = 0.15f),
                    selectedLabelColor = DeepSepia,
                ),
            )
        }
    }
}

@Composable
private fun ProductCard(product: Product, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column {
            AsyncImage(
                model = product.imageUrls.firstOrNull(),
                contentDescription = product.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(MaterialTheme.shapes.medium),
            )
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = product.title,
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "CNY ${String.format("%.2f", product.price)}",
                    style = MaterialTheme.typography.labelLarge,
                    color = DeepSepia,
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${product.welfareContribution}% to welfare",
                    style = MaterialTheme.typography.labelSmall,
                    color = SuccessGreen,
                )
            }
        }
    }
}
