package org.tonghua.app.data.api

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import org.tonghua.app.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import android.util.Base64
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * OkHttp client configuration with httpOnly Cookie authentication.
 *
 * NOTE: Authentication is handled via httpOnly cookies, not Bearer tokens.
 * The server manages session state via Set-Cookie headers.
 */
@Singleton
class ApiClient @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    companion object {
        private val BASE_URL: String
            get() = BuildConfig.API_BASE_URL
        private const val TIMEOUT_SECONDS = 30L
    }

    val api: TonghuaApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(createOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(TonghuaApi::class.java)
    }

    private fun createOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .cookieJar(AndroidCookieJar(context))
            .addInterceptor(loggingInterceptor())
            .build()
    }

    private fun loggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }
}

/**
 * Cookie jar implementation for Android that persists cookies across app sessions.
 * Uses EncryptedSharedPreferences to securely store cookies.
 */
class AndroidCookieJar(private val context: Context) : CookieJar {
    private val prefs by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "tonghua_cookies_encrypted",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
    private val cookieKey = "stored_cookies"
    private val gson = Gson()

    /**
     * Data class for secure cookie serialization.
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

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        // Convert cookies to serializable format
        val serializableCookies = cookies.map { cookie ->
            SerializableCookie(
                name = cookie.name,
                value = cookie.value,
                domain = cookie.domain,
                path = cookie.path,
                expiresAt = if (cookie.expiresAt != Long.MAX_VALUE) cookie.expiresAt else null,
                secure = cookie.secure,
                httpOnly = cookie.httpOnly,
            )
        }

        // Serialize cookies to JSON string
        val json = gson.toJson(serializableCookies)
        val base64Encoded = Base64.encodeToString(json.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)

        prefs.edit().putString(cookieKey, base64Encoded).apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val base64Encoded = prefs.getString(cookieKey, "") ?: ""
        if (base64Encoded.isEmpty()) return emptyList()

        return try {
            // Decode Base64 and parse JSON
            val json = String(Base64.decode(base64Encoded, Base64.NO_WRAP), Charsets.UTF_8)
            val type = object : TypeToken<List<SerializableCookie>>() {}.type
            val serializableCookies: List<SerializableCookie> = gson.fromJson(json, type)

            serializableCookies.mapNotNull { serializableCookie ->
                try {
                    // Build cookie string in the format OkHttp expects
                    val cookieString = buildString {
                        append("${serializableCookie.name}=${serializableCookie.value}")
                        serializableCookie.domain?.let { append("; Domain=$it") }
                        serializableCookie.path?.let { append("; Path=$it") }
                        serializableCookie.expiresAt?.let {
                            append("; Expires=${java.time.Instant.ofEpochMilli(it)}")
                        }
                        if (serializableCookie.secure) append("; Secure")
                        if (serializableCookie.httpOnly) append("; HttpOnly")
                    }

                    val cookie = Cookie.parse(url, cookieString)
                    // Filter out expired cookies
                    if (cookie != null && !cookie.expiresAt.isExpired()) {
                        cookie
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    // Log parsing error but continue with other cookies
                    android.util.Log.e("AndroidCookieJar", "Error parsing cookie: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            // If deserialization fails, return empty list and log error
            android.util.Log.e("AndroidCookieJar", "Error deserializing cookies: ${e.message}")
            emptyList()
        }
    }

    /**
     * Extension function to check if a timestamp is expired.
     * Uses the same logic as OkHttp's Cookie.expired() method.
     */
    private fun Long.isExpired(): Boolean {
        return this < System.currentTimeMillis()
    }
}
