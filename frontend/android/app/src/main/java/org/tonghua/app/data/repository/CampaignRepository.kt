package org.tonghua.app.data.repository

import org.tonghua.app.data.api.TonghuaApi
import org.tonghua.app.data.model.Campaign
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for campaign operations.
 */
@Singleton
class CampaignRepository @Inject constructor(
    private val api: TonghuaApi,
) {
    suspend fun getCampaigns(page: Int = 1, status: String? = null): Result<List<Campaign>> {
        return try {
            val response = api.getCampaigns(page, status)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Failed to load campaigns"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getActiveCampaign(): Result<Campaign> {
        return try {
            val response = api.getActiveCampaign()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "No active campaign"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCampaignDetail(id: String): Result<Campaign> {
        return try {
            val response = api.getCampaignDetail(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Campaign not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
