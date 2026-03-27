package org.tonghua.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.tonghua.app.data.model.Product
import org.tonghua.app.data.model.ShippingAddress
import org.tonghua.app.data.model.TraceabilityRecord
import org.tonghua.app.data.repository.ProductRepository
import javax.inject.Inject

/**
 * UI state for the shop screen.
 */
data class ShopUiState(
    val isLoading: Boolean = true,
    val products: List<Product> = emptyList(),
    val selectedCategory: String? = null,
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val error: String? = null,
)

/**
 * UI state for product detail screen.
 */
data class ProductDetailUiState(
    val isLoading: Boolean = true,
    val product: Product? = null,
    val traceability: List<TraceabilityRecord> = emptyList(),
    val error: String? = null,
)

/**
 * ViewModel for shop and product operations.
 */
@HiltViewModel
class ShopViewModel @Inject constructor(
    private val productRepository: ProductRepository,
) : ViewModel() {

    private val _shopState = MutableStateFlow(ShopUiState())
    val shopState: StateFlow<ShopUiState> = _shopState.asStateFlow()

    private val _detailState = MutableStateFlow(ProductDetailUiState())
    val detailState: StateFlow<ProductDetailUiState> = _detailState.asStateFlow()

    init {
        loadProducts()
    }

    fun loadProducts(category: String? = null, page: Int = 1) {
        viewModelScope.launch {
            _shopState.value = _shopState.value.copy(isLoading = true, error = null)

            productRepository.getProducts(page = page, category = category)
                .onSuccess { (products, meta) ->
                    _shopState.value = _shopState.value.copy(
                        isLoading = false,
                        products = products,
                        selectedCategory = category,
                        currentPage = meta?.page ?: 1,
                        totalPages = meta?.total_pages ?: 1,
                    )
                }
                .onFailure { e ->
                    _shopState.value = _shopState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load products",
                    )
                }
        }
    }

    fun loadProductDetail(id: String) {
        viewModelScope.launch {
            _detailState.value = ProductDetailUiState(isLoading = true)

            val productResult = productRepository.getProductDetail(id)
            val traceResult = productRepository.getTraceability(id)

            _detailState.value = ProductDetailUiState(
                isLoading = false,
                product = productResult.getOrNull(),
                traceability = traceResult.getOrNull() ?: emptyList(),
                error = listOfNotNull(
                    productResult.exceptionOrNull()?.message,
                    traceResult.exceptionOrNull()?.message,
                ).joinToString("; ").ifEmpty { null },
            )
        }
    }

    fun selectCategory(category: String?) {
        loadProducts(category = category)
    }

    fun refresh() {
        loadProducts(category = _shopState.value.selectedCategory)
    }

    fun placeOrder(
        productId: String,
        recipientName: String,
        phone: String,
        addressLine: String,
        city: String,
        province: String,
        postalCode: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit,
    ) {
        viewModelScope.launch {
            val address = ShippingAddress(
                name = recipientName,
                phone = phone,
                province = province,
                city = city,
                district = "",
                address = addressLine,
                postalCode = postalCode.ifBlank { null },
            )
            productRepository.createOrder(
                productId = productId,
                quantity = 1,
                shippingAddress = address,
            )
                .onSuccess { onSuccess() }
                .onFailure { e -> onError(e.message ?: "Order placement failed") }
        }
    }
}
