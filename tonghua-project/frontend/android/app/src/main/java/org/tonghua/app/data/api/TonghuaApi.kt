package org.tonghua.app.data.api

import org.tonghua.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API interface for Tonghua Public Welfare backend.
 * Base URL: https://api.tonghua.org/api/v1/
 */
interface TonghuaApi {

    // ---- Auth ----

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/wechat-login")
    suspend fun wechatLogin(@Body request: WechatLoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Map<String, String>>>

    // ---- Artworks ----

    @GET("artworks")
    suspend fun getArtworks(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20,
        @Query("campaign_id") campaignId: String? = null,
        @Query("sort") sort: String? = null,
        @Query("status") status: String? = null,
    ): Response<ApiResponse<List<Artwork>>>

    @GET("artworks/{id}")
    suspend fun getArtworkDetail(@Path("id") id: String): Response<ApiResponse<Artwork>>

    @POST("artworks/{id}/vote")
    suspend fun voteArtwork(@Path("id") id: String): Response<ApiResponse<Map<String, Any>>>

    @GET("artworks/{id}/status")
    suspend fun getArtworkStatus(@Path("id") id: String): Response<ApiResponse<Map<String, Any>>>

    // ---- Campaigns ----

    @GET("campaigns")
    suspend fun getCampaigns(
        @Query("page") page: Int = 1,
        @Query("status") status: String? = null,
    ): Response<ApiResponse<List<Campaign>>>

    @GET("campaigns/active")
    suspend fun getActiveCampaign(): Response<ApiResponse<Campaign>>

    @GET("campaigns/{id}")
    suspend fun getCampaignDetail(@Path("id") id: String): Response<ApiResponse<Campaign>>

    // ---- Donations ----

    @POST("donations/initiate")
    suspend fun initiateDonation(@Body request: InitiateDonationRequest): Response<ApiResponse<DonationInitiationResponse>>

    @GET("donations/{id}")
    suspend fun getDonationDetail(@Path("id") id: String): Response<ApiResponse<Donation>>

    @GET("donations/{id}/certificate")
    suspend fun getDonationCertificate(@Path("id") id: String): Response<ApiResponse<Map<String, String>>>

    // ---- Products ----

    @GET("products")
    suspend fun getProducts(
        @Query("page") page: Int = 1,
        @Query("category") category: String? = null,
        @Query("sort") sort: String? = null,
        @Query("min_price") minPrice: Double? = null,
        @Query("max_price") maxPrice: Double? = null,
    ): Response<ApiResponse<List<Product>>>

    @GET("products/{id}")
    suspend fun getProductDetail(@Path("id") id: String): Response<ApiResponse<Product>>

    @GET("products/{id}/traceability")
    suspend fun getProductTraceability(@Path("id") id: String): Response<ApiResponse<TraceabilityResponse>>

    // ---- Orders ----

    @POST("orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): Response<ApiResponse<Order>>

    @GET("orders/{id}")
    suspend fun getOrderDetail(@Path("id") id: String): Response<ApiResponse<Order>>

    // ---- Payments ----

    @POST("payments/create")
    suspend fun createPaymentIntent(@Body request: CreatePaymentIntentRequest): Response<ApiResponse<PaymentIntentResponse>>
}

/**
 * Standard API response envelope matching the backend contract.
 */
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?,
    val meta: ApiMeta?,
)

data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, Any>?,
)

data class ApiMeta(
    val page: Int,
    val per_page: Int,
    val total: Int,
    val total_pages: Int,
)
