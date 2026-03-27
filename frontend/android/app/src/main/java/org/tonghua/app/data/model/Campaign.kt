package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * Campaign model for charity art campaigns.
 */
data class Campaign(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("theme") val theme: String,
    @SerializedName("description") val description: String,
    @SerializedName("cover_image_url") val coverImageUrl: String?,
    @SerializedName("start_date") val startDate: String,
    @SerializedName("end_date") val endDate: String,
    @SerializedName("status") val status: String,
    @SerializedName("max_artworks") val maxArtworks: Int?,
    @SerializedName("artwork_count") val artworkCount: Int,
    @SerializedName("vote_enabled") val voteEnabled: Boolean,
)
