package org.tonghua.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import org.tonghua.app.data.model.Artwork
import org.tonghua.app.data.model.Campaign
import org.tonghua.app.data.repository.ArtworkRepository
import org.tonghua.app.data.repository.CampaignRepository
import javax.inject.Inject

/**
 * UI state for the home screen.
 */
data class HomeUiState(
    val isLoading: Boolean = true,
    val activeCampaign: Campaign? = null,
    val featuredArtworks: List<Artwork> = emptyList(),
    val error: String? = null,
)

/**
 * ViewModel for the home screen, loading campaign and featured artworks.
 */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val campaignRepository: CampaignRepository,
    private val artworkRepository: ArtworkRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            // Load campaign and artworks in parallel
            val campaignDeferred = async { campaignRepository.getActiveCampaign() }
            val artworksDeferred = async { artworkRepository.getArtworks(perPage = 6, sort = "vote_count") }

            val campaignResult = campaignDeferred.await()
            val artworksResult = artworksDeferred.await()

            val campaign = campaignResult.getOrNull()
            val artworks = artworksResult.getOrNull()?.first ?: emptyList()
            val error = listOfNotNull(
                campaignResult.exceptionOrNull()?.message,
                artworksResult.exceptionOrNull()?.message,
            ).joinToString("; ").ifEmpty { null }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                activeCampaign = campaign,
                featuredArtworks = artworks,
                error = error,
            )
        }
    }

    fun refresh() {
        loadHomeData()
    }

    fun voteArtwork(artworkId: String) {
        viewModelScope.launch {
            val result = artworkRepository.voteArtwork(artworkId)
            result.onSuccess {
                // Refresh to update vote count
                loadHomeData()
            }
            result.onFailure { e ->
                _uiState.value = _uiState.value.copy(error = e.message ?: "Vote failed")
            }
        }
    }
}
