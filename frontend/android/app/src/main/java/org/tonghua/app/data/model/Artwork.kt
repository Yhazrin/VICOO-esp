package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Artwork model for the Tonghua Public Welfare platform.
 */
data class Artwork(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("image_url") val imageUrl: String,
    @SerializedName("thumbnail_url") val thumbnailUrl: String?,
    @SerializedName("display_name") val displayName: String,
    @SerializedName("campaign_title") val campaignTitle: String?,
    @SerializedName("campaign_id") val campaignId: String?,
    @SerializedName("description") val description: String?,
    @SerializedName("vote_count") val voteCount: Int,
    @SerializedName("has_voted") val hasVoted: Boolean = false,
    @SerializedName("status") val status: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("related_products") val relatedProducts: List<ProductRef> = emptyList(),
)

/**
 * Minimal product reference embedded in artwork detail.
 */
data class ProductRef(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("price") val price: Double,
)

/**
 * Campaign reference embedded in artwork detail.
 */
data class CampaignRef(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
)
