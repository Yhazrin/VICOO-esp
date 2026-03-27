package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Order model.
 */
data class Order(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("product_id") val productId: String,
    @SerializedName("quantity") val quantity: Int,
    @SerializedName("unit_price") val unitPrice: Double,
    @SerializedName("total_amount") val totalAmount: Double,
    @SerializedName("status") val status: String,
    @SerializedName("shipping_address") val shippingAddress: ShippingAddress?,
    @SerializedName("created_at") val createdAt: String,
)

/**
 * Shipping address.
 */
data class ShippingAddress(
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("province") val province: String,
    @SerializedName("city") val city: String,
    @SerializedName("district") val district: String,
    @SerializedName("address") val address: String,
    @SerializedName("postal_code") val postalCode: String?,
)

/**
 * Create order request body.
 */
data class CreateOrderRequest(
    @SerializedName("product_id") val productId: String,
    @SerializedName("quantity") val quantity: Int,
    @SerializedName("shipping_address") val shippingAddress: ShippingAddress,
    @SerializedName("payment_provider") val paymentProvider: String,
)
