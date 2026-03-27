package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Product model for sustainable fashion items.
 */
data class Product(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("price") val price: Double,
    @SerializedName("materials") val materials: String,
    @SerializedName("sustainability_info") val sustainabilityInfo: String,
    @SerializedName("welfare_contribution") val welfareContribution: Double,
    @SerializedName("image_urls") val imageUrls: List<String>,
    @SerializedName("source_artwork") val sourceArtwork: ArtworkRef?,
    @SerializedName("stock") val stock: Int,
    @SerializedName("category") val category: String,
)

/**
 * Artwork reference embedded in product detail.
 */
data class ArtworkRef(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("display_name") val displayName: String,
    @SerializedName("image_url") val imageUrl: String,
)

/**
 * Supply chain traceability record.
 */
data class TraceabilityRecord(
    @SerializedName("step") val step: String,
    @SerializedName("date") val date: String,
    @SerializedName("facility") val facility: String,
    @SerializedName("description") val description: String,
    @SerializedName("verified") val verified: Boolean,
    @SerializedName("blockchain_hash") val blockchainHash: String?,
)

/**
 * Traceability response wrapping a list of records.
 */
data class TraceabilityResponse(
    @SerializedName("product_id") val productId: String,
    @SerializedName("records") val records: List<TraceabilityRecord>,
)
