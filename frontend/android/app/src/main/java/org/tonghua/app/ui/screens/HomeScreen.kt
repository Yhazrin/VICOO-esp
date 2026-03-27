package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import org.tonghua.app.data.model.Artwork
import org.tonghua.app.data.model.Campaign
import org.tonghua.app.ui.theme.*
import org.tonghua.app.viewmodel.HomeViewModel

/**
 * Home screen — editorial hero with active campaign and featured artworks.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onArtworkClick: (String) -> Unit,
    onCampaignClick: (String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(MaterialTheme.colorScheme.background)
    ) {
        // ---- Editorial Hero ----
        EditorialHeroSection(campaign = uiState.activeCampaign)

        Spacer(modifier = Modifier.height(32.dp))

        // ---- Featured Artworks ----
        SectionHeader(
            number = "01",
            title = "Featured Artworks",
            subtitle = "Selected works from our young artists",
        )

        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = DeepSepia)
            }
        } else {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(top = 16.dp),
            ) {
                items(uiState.featuredArtworks) { artwork ->
                    ArtworkCard(
                        artwork = artwork,
                        onClick = { onArtworkClick(artwork.id) },
                    )
                }
            }
        }

        // ---- Error State ----
        uiState.error?.let { error ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = ErrorRed.copy(alpha = 0.1f)),
            ) {
                Text(
                    text = error,
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(16.dp),
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ---- Mission Statement ----
        MissionStatementSection()

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun EditorialHeroSection(campaign: Campaign?) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(320.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant)
    ) {
        // Campaign cover image
        AsyncImage(
            model = campaign?.coverImageUrl,
            contentDescription = campaign?.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )

        // Gradient overlay for readability
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.background.copy(alpha = 0.3f),
                            MaterialTheme.colorScheme.background.copy(alpha = 0.9f),
                        ),
                        startY = 100f,
                    )
                )
        )

        // Content
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(24.dp)
        ) {
            Text(
                text = "01",
                style = MaterialTheme.typography.labelLarge,
                color = DeepSepia,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = campaign?.title ?: "Tonghua Public Welfare",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = campaign?.theme ?: "Sustainable Fashion for a Better World",
                style = MaterialTheme.typography.bodyLarge,
                color = SlateGray,
            )
        }
    }
}

@Composable
private fun SectionHeader(number: String, title: String, subtitle: String) {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = number,
                style = MaterialTheme.typography.labelLarge,
                color = DeepSepia,
                modifier = Modifier.width(32.dp),
            )
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = SlateGray,
            modifier = Modifier.padding(start = 32.dp),
        )
    }
}

@Composable
private fun ArtworkCard(artwork: Artwork, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(200.dp)
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column {
            AsyncImage(
                model = artwork.thumbnailUrl ?: artwork.imageUrl,
                contentDescription = artwork.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(MaterialTheme.shapes.medium),
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = artwork.title,
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "by ${artwork.displayName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = SlateGray,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "${artwork.voteCount} votes",
                        style = MaterialTheme.typography.labelSmall,
                        color = DeepSepia,
                    )
                }
            }
        }
    }
}

@Composable
private fun MissionStatementSection() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(24.dp)
    ) {
        Text(
            text = "Our Mission",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "We connect children's art with sustainable fashion, creating a transparent bridge between creativity and ethical production. Every purchase supports young artists and funds charitable education programs.",
            style = MaterialTheme.typography.bodyLarge,
            color = SlateGray,
            lineHeight = MaterialTheme.typography.bodyLarge.lineHeight,
        )
    }
}
