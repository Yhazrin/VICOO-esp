package org.tonghua.app.data.repository

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import org.tonghua.app.data.api.ApiResponse
import org.tonghua.app.data.api.TonghuaApi
import org.tonghua.app.data.model.AuthResponse
import org.tonghua.app.data.model.LoginRequest
import org.tonghua.app.data.model.WechatLoginRequest
import android.util.Base64
import javax.inject.Inject
import javax.inject.Singleton
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Repository for authentication operations.
 *
 * NOTE: Authentication is handled via httpOnly cookies managed by the server.
 * No client-side token storage is needed.
 */
@Singleton
class AuthRepository @Inject constructor(
    private val api: TonghuaApi,
    @ApplicationContext private val context: Context,
) {
    private val gson = Gson()

    /**
     * Data class for secure cookie serialization (must match ApiClient format).
     * Using explicit fields prevents injection attacks.
     */
    private data class SerializableCookie(
        val name: String,
        val value: String,
        val domain: String?,
        val path: String?,
        val expiresAt: Long?,
        val secure: Boolean,
        val httpOnly: Boolean,
    )
    /**
     * Login with email and password.
     * Server sets httpOnly cookies for session management.
     */
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body()?.success == true) {
                // Server sets httpOnly cookies via Set-Cookie header
                Result.success(response.body()!!.data!!)
            } else {
                val error = response.body()?.error?.message ?: "Login failed"
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Login with WeChat code.
     * Server sets httpOnly cookies for session management.
     */
    suspend fun wechatLogin(code: String): Result<AuthResponse> {
        return try {
            val request = WechatLoginRequest(code = code)
            val response = api.wechatLogin(request)
            if (response.isSuccessful && response.body()?.success == true) {
                // Server sets httpOnly cookies via Set-Cookie header
                Result.success(response.body()!!.data!!)
            } else {
                val error = response.body()?.error?.message ?: "WeChat login failed"
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Logout - server clears session cookies.
     */
    suspend fun logout(): Result<Unit> {
        return try {
            api.logout()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.success(Unit) // Always succeed even if API fails
        }
    }

    /**
     * Check if user is currently logged in.
     * NOTE: This is a client-side check. For server-side validation,
     * the API will return 401 if the session is invalid.
     *
     * Implementation: Checks for presence of non-expired session cookies in EncryptedSharedPreferences.
     * Cookies are persisted by AndroidCookieJar in the "tonghua_cookies_encrypted" shared prefs.
     *
     * Note: This validates cookie expiration client-side. If cookies are expired,
     * the app will clear them and return false. API calls will still return 401
     * if the session is actually expired server-side.
     */
    fun isLoggedIn(): Boolean {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            val prefs = EncryptedSharedPreferences.create(
                context,
                "tonghua_cookies_encrypted",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            val base64Encoded = prefs.getString("stored_cookies", "") ?: ""

            // Check if cookies exist
            if (base64Encoded.isEmpty()) {
                return false
            }

            // Decode and parse cookies using the secure format
            return try {
                val json = String(Base64.decode(base64Encoded, Base64.NO_WRAP), Charsets.UTF_8)
                val type = object : TypeToken<List<SerializableCookie>>() {}.type
                val serializableCookies: List<SerializableCookie> = gson.fromJson(json, type)

                // Check if at least one cookie is valid (not expired)
                val hasValidCookie = serializableCookies.any { cookie ->
                    try {
                        // If no expiration set, it's a session cookie (valid)
                        cookie.expiresAt == null || cookie.expiresAt > System.currentTimeMillis()
                    } catch (e: Exception) {
                        Log.e("AuthRepository", "Error checking cookie expiration: ${e.message}")
                        false
                    }
                }

                hasValidCookie
            } catch (e: Exception) {
                Log.e("AuthRepository", "Error deserializing cookies in isLoggedIn(): ${e.message}")
                false
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Error accessing encrypted preferences: ${e.message}")
            false
        }
    }
}
