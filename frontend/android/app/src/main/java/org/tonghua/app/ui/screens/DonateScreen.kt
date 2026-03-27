package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.tonghua.app.viewmodel.DonateViewModel

/**
 * Donation screen with amount selection, message, and payment provider.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonateScreen(
    viewModel: DonateViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "04",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = "Donate",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Support children's art education and sustainable fashion",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (uiState.donationSuccess) {
            // Success state
            DonationSuccessCard(
                donationId = uiState.donationId,
                onNewDonation = { viewModel.resetDonation() },
            )
        } else {
            // Donation form
            DonationForm(
                uiState = uiState,
                onAmountChange = viewModel::updateAmount,
                onMessageChange = viewModel::updateMessage,
                onAnonymousToggle = viewModel::toggleAnonymous,
                onProviderSelect = viewModel::selectProvider,
                onSubmit = viewModel::submitDonation,
            )
        }

        // Error
        uiState.error?.let { error ->
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
            ) {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(16.dp),
                )
            }
        }
    }
}

@Composable
private fun DonationForm(
    uiState: org.tonghua.app.viewmodel.DonateUiState,
    onAmountChange: (String) -> Unit,
    onMessageChange: (String) -> Unit,
    onAnonymousToggle: () -> Unit,
    onProviderSelect: (String) -> Unit,
    onSubmit: () -> Unit,
) {
    // Preset amounts
    Text(
        text = "Select Amount",
        style = MaterialTheme.typography.titleMedium,
    )
    Spacer(modifier = Modifier.height(8.dp))

    val presetAmounts = listOf("10", "50", "100", "200", "500")
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        presetAmounts.forEach { amount ->
            val isSelected = uiState.amount == amount
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onAmountChange(amount) },
                shape = RoundedCornerShape(8.dp),
                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
            ) {
                Text(
                    text = amount,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .padding(vertical = 12.dp)
                        .wrapContentWidth(Alignment.CenterHorizontally),
                )
            }
        }
    }

    Spacer(modifier = Modifier.height(12.dp))

    // Custom amount input
    OutlinedTextField(
        value = uiState.amount,
        onValueChange = onAmountChange,
        label = { Text("Custom Amount (CNY)") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
    )

    Spacer(modifier = Modifier.height(16.dp))

    // Message
    OutlinedTextField(
        value = uiState.message,
        onValueChange = onMessageChange,
        label = { Text("Message (optional)") },
        modifier = Modifier.fillMaxWidth(),
        minLines = 2,
        maxLines = 4,
    )

    Spacer(modifier = Modifier.height(12.dp))

    // Anonymous toggle
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onAnonymousToggle() },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(
            checked = uiState.isAnonymous,
            onCheckedChange = null,
            colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary),
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "Donate anonymously",
            style = MaterialTheme.typography.bodyMedium,
        )
    }

    Spacer(modifier = Modifier.height(16.dp))

    // Payment provider selection
    Text(
        text = "Payment Method",
        style = MaterialTheme.typography.titleMedium,
    )
    Spacer(modifier = Modifier.height(8.dp))

    val providers = listOf(
        "alipay" to "Alipay",
        "wechat_pay" to "WeChat Pay",
        "stripe" to "Stripe",
    )

    providers.forEach { (key, label) ->
        val isSelected = uiState.selectedProvider == key
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp)
                .clickable { onProviderSelect(key) }
                .then(
                    if (isSelected) Modifier.border(
                        2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(8.dp)
                    ) else Modifier
                ),
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.surface,
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (isSelected) {
                    Icon(
                        Icons.Filled.Check,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }

    Spacer(modifier = Modifier.height(24.dp))

    // Submit button
    Button(
        onClick = onSubmit,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = !uiState.isLoading && uiState.amount.isNotEmpty(),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
        shape = MaterialTheme.shapes.medium,
    ) {
        if (uiState.isLoading) {
            CircularProgressIndicator(
                color = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
            )
        } else {
            Text(
                text = "Donate CNY ${uiState.amount.ifEmpty { "0" }}",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimary,
            )
        }
    }
}

@Composable
private fun DonationSuccessCard(
    donationId: String?,
    onNewDonation: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Filled.Check,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.size(48.dp),
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Thank You!",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.tertiary,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Your donation has been initiated. A certificate will be generated after payment is confirmed.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            donationId?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Reference: $it",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(
                onClick = onNewDonation,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary),
            ) {
                Text("Make Another Donation")
            }
        }
    }
}
