package org.tonghua.app.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import org.tonghua.app.data.api.ApiClient
import org.tonghua.app.data.api.TonghuaApi
import javax.inject.Singleton

/**
 * Hilt module providing application-level dependencies.
 *
 * NOTE: Authentication is handled via httpOnly cookies managed by the server.
 * No client-side token storage is needed.
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideApiClient(
        @ApplicationContext context: Context,
    ): ApiClient {
        return ApiClient(context)
    }

    @Provides
    @Singleton
    fun provideApi(apiClient: ApiClient): TonghuaApi {
        return apiClient.api
    }
}
