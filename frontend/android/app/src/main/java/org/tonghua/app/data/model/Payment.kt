package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Payment method type.
 */
enum class PaymentMethod {
    @SerializedName("wechat")
    WECHAT,

    @SerializedName("alipay")
    ALIPAY,

    @SerializedName("card")
    CARD,

    @SerializedName("stripe")
    STRIPE,

    @SerializedName("paypal")
    PAYPAL,
}

/**
 * Create payment intent request body.
 */
data class CreatePaymentIntentRequest(
    @SerializedName("order_id") val orderId: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("currency") val currency: String = "CNY",
    @SerializedName("payment_method") val paymentMethod: PaymentMethod,
    @SerializedName("description") val description: String?,
)

/**
 * Payment intent response.
 */
data class PaymentIntentResponse(
    @SerializedName("client_secret") val clientSecret: String,
    @SerializedName("payment_intent_id") val paymentIntentId: String,
    @SerializedName("status") val status: String,
)
