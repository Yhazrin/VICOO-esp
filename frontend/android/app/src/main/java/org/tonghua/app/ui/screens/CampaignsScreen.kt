package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import org.tonghua.app.data.model.Campaign
import org.tonghua.app.ui.theme.*
import org.tonghua.app.viewmodel.HomeViewModel

/**
 * Campaigns listing screen.
 */
@Composable
fun CampaignsScreen(
    onCampaignClick: (String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "02",
                style = MaterialTheme.typography.labelLarge,
                color = DeepSepia,
            )
            Text(
                text = "Campaigns",
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Art initiatives connecting children with sustainable fashion",
                style = MaterialTheme.typography.bodyMedium,
                color = SlateGray,
            )
        }

        // Active Campaign Card
        uiState.activeCampaign?.let { campaign ->
            ActiveCampaignCard(
                campaign = campaign,
                onClick = { onCampaignClick(campaign.id) },
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Campaign list
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = DeepSepia)
            }
        } else {
            Text(
                text = "Past Campaigns",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // Show the active campaign as a list item too
                uiState.activeCampaign?.let { campaign ->
                    item {
                        CampaignListItem(
                            campaign = campaign,
                            onClick = { onCampaignClick(campaign.id) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveCampaignCard(campaign: Campaign, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column {
            AsyncImage(
                model = campaign.coverImageUrl,
                contentDescription = campaign.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .clip(MaterialTheme.shapes.large),
            )
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "ACTIVE",
                        style = MaterialTheme.typography.labelSmall,
                        color = SuccessGreen,
                    )
                    Text(
                        text = "${campaign.artworkCount} artworks",
                        style = MaterialTheme.typography.labelSmall,
                        color = SlateGray,
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = campaign.title,
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = campaign.theme,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MutedBrown,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${campaign.startDate} - ${campaign.endDate}",
                    style = MaterialTheme.typography.labelMedium,
                    color = CaptionGray,
                )
            }
        }
    }
}

@Composable
private fun CampaignListItem(campaign: Campaign, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = campaign.title,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = campaign.theme,
                    style = MaterialTheme.typography.bodySmall,
                    color = SlateGray,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Text(
                text = campaign.status.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = when (campaign.status) {
                    "active" -> SuccessGreen
                    "ended" -> CaptionGray
                    else -> SlateGray
                },
            )
        }
    }
}
