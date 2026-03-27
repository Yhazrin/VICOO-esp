package org.tonghua.app.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import org.tonghua.app.data.api.TonghuaApi
import org.tonghua.app.data.repository.*
import javax.inject.Singleton

/**
 * Hilt module providing repository dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        api: TonghuaApi,
        @ApplicationContext context: Context,
    ): AuthRepository {
        return AuthRepository(api, context)
    }

    @Provides
    @Singleton
    fun provideArtworkRepository(api: TonghuaApi): ArtworkRepository {
        return ArtworkRepository(api)
    }

    @Provides
    @Singleton
    fun provideCampaignRepository(api: TonghuaApi): CampaignRepository {
        return CampaignRepository(api)
    }

    @Provides
    @Singleton
    fun provideProductRepository(api: TonghuaApi): ProductRepository {
        return ProductRepository(api)
    }
}
