package org.tonghua.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.tonghua.app.data.model.Donation
import org.tonghua.app.data.repository.DonationRepository
import javax.inject.Inject

/**
 * UI state for the donation screen.
 */
data class DonateUiState(
    val isLoading: Boolean = false,
    val amount: String = "",
    val message: String = "",
    val isAnonymous: Boolean = false,
    val selectedProvider: String = "alipay",
    val donationSuccess: Boolean = false,
    val donationId: String? = null,
    val recentDonations: List<Donation> = emptyList(),
    val error: String? = null,
)

/**
 * ViewModel for donation operations.
 */
@HiltViewModel
class DonateViewModel @Inject constructor(
    private val donationRepository: DonationRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DonateUiState())
    val uiState: StateFlow<DonateUiState> = _uiState.asStateFlow()

    fun updateAmount(amount: String) {
        _uiState.value = _uiState.value.copy(amount = amount)
    }

    fun updateMessage(message: String) {
        _uiState.value = _uiState.value.copy(message = message)
    }

    fun toggleAnonymous() {
        _uiState.value = _uiState.value.copy(isAnonymous = !_uiState.value.isAnonymous)
    }

    fun selectProvider(provider: String) {
        _uiState.value = _uiState.value.copy(selectedProvider = provider)
    }

    fun submitDonation() {
        val amountStr = _uiState.value.amount
        val amount = amountStr.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            _uiState.value = _uiState.value.copy(error = "Please enter a valid amount")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            donationRepository.initiateDonation(
                amount = amount,
                message = _uiState.value.message.ifEmpty { null },
                isAnonymous = _uiState.value.isAnonymous,
                paymentProvider = _uiState.value.selectedProvider,
            )
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        donationSuccess = true,
                        donationId = response.donationId,
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Donation failed",
                    )
                }
        }
    }

    fun resetDonation() {
        _uiState.value = DonateUiState()
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
