package org.tonghua.app.data.repository

import org.tonghua.app.data.api.ApiMeta
import org.tonghua.app.data.api.TonghuaApi
import org.tonghua.app.data.model.Artwork
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for artwork operations.
 */
@Singleton
class ArtworkRepository @Inject constructor(
    private val api: TonghuaApi,
) {
    suspend fun getArtworks(
        page: Int = 1,
        perPage: Int = 20,
        campaignId: String? = null,
        sort: String? = null,
    ): Result<Pair<List<Artwork>, ApiMeta?>> {
        return try {
            val response = api.getArtworks(page, perPage, campaignId, sort)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Pair(response.body()!!.data ?: emptyList(), response.body()!!.meta))
            } else {
                val error = response.body()?.error?.message ?: "Failed to load artworks"
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getArtworkDetail(id: String): Result<Artwork> {
        return try {
            val response = api.getArtworkDetail(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                val error = response.body()?.error?.message ?: "Artwork not found"
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun voteArtwork(id: String): Result<Int> {
        return try {
            val response = api.voteArtwork(id)
            if (response.isSuccessful && response.body()?.success == true) {
                val voteCount = (response.body()!!.data!!["vote_count"] as? Number)?.toInt() ?: 0
                Result.success(voteCount)
            } else {
                val error = response.body()?.error?.message ?: "Vote failed"
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
