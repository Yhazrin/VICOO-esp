package org.tonghua.app.data.repository

import org.tonghua.app.data.api.TonghuaApi
import org.tonghua.app.data.model.Donation
import org.tonghua.app.data.model.DonationInitiationResponse
import org.tonghua.app.data.model.InitiateDonationRequest
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for donation operations.
 */
@Singleton
class DonationRepository @Inject constructor(
    private val api: TonghuaApi,
) {
    suspend fun initiateDonation(
        amount: Double,
        message: String? = null,
        isAnonymous: Boolean = false,
        paymentProvider: String,
    ): Result<DonationInitiationResponse> {
        return try {
            val request = InitiateDonationRequest(
                amount = amount,
                message = message,
                isAnonymous = isAnonymous,
                paymentProvider = paymentProvider,
            )
            val response = api.initiateDonation(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Donation initiation failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDonationDetail(id: String): Result<Donation> {
        return try {
            val response = api.getDonationDetail(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Donation not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDonationCertificate(id: String): Result<String> {
        return try {
            val response = api.getDonationCertificate(id)
            if (response.isSuccessful && response.body()?.success == true) {
                val url = response.body()!!.data?.get("certificate_url") ?: ""
                Result.success(url)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Certificate not available"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
