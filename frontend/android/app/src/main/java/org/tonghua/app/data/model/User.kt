package org.tonghua.app.data.model

import com.google.gson.annotations.SerializedName

/**
 * User model matching the backend API response.
 */
data class User(
    @SerializedName("id") val id: String,
    @SerializedName("display_name") val displayName: String,
    @SerializedName("avatar_url") val avatarUrl: String?,
    @SerializedName("role") val role: String,
    @SerializedName("email") val email: String?,
    @SerializedName("created_at") val createdAt: String?,
)

/**
 * Authentication response from /auth/login and /auth/refresh.
 */
data class AuthResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String?,
    @SerializedName("expires_in") val expiresIn: Int,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("user") val user: User,
)

/**
 * Login request body.
 */
data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
)

/**
 * WeChat login request body.
 */
data class WechatLoginRequest(
    @SerializedName("login_type") val loginType: String = "wechat",
    @SerializedName("code") val code: String,
)

/**
 * Refresh token request body.
 */
data class RefreshRequest(
    @SerializedName("refresh_token") val refreshToken: String,
)
