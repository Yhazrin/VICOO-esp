package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Donation model.
 */
data class Donation(
    @SerializedName("id") val id: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("currency") val currency: String,
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String?,
    @SerializedName("is_anonymous") val isAnonymous: Boolean,
    @SerializedName("donor_name") val donorName: String?,
    @SerializedName("created_at") val createdAt: String,
)

/**
 * Initiate donation request body.
 */
data class InitiateDonationRequest(
    @SerializedName("amount") val amount: Double,
    @SerializedName("currency") val currency: String = "CNY",
    @SerializedName("message") val message: String? = null,
    @SerializedName("is_anonymous") val isAnonymous: Boolean = false,
    @SerializedName("payment_provider") val paymentProvider: String,
)

/**
 * Donation initiation response.
 */
data class DonationInitiationResponse(
    @SerializedName("donation_id") val donationId: String,
    @SerializedName("payment_client_secret") val paymentClientSecret: String?,
    @SerializedName("payment_provider") val paymentProvider: String,
)
