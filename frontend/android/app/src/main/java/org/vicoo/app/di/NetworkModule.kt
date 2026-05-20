package org.vicoo.app.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import org.vicoo.app.data.api.VICOOApi
import org.vicoo.app.data.repository.*
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
        api: VICOOApi,
        @ApplicationContext context: Context,
    ): AuthRepository {
        return AuthRepository(api, context)
    }

    @Provides
    @Singleton
    fun provideArtworkRepository(api: VICOOApi): ArtworkRepository {
        return ArtworkRepository(api)
    }

    @Provides
    @Singleton
    fun provideCampaignRepository(api: VICOOApi): CampaignRepository {
        return CampaignRepository(api)
    }

    @Provides
    @Singleton
    fun provideProductRepository(api: VICOOApi): ProductRepository {
        return ProductRepository(api)
    }
}
