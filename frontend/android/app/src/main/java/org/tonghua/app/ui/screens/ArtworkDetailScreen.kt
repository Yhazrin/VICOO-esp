package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import org.tonghua.app.data.model.Artwork
import org.tonghua.app.ui.theme.*
import org.tonghua.app.viewmodel.HomeViewModel

/**
 * Artwork detail screen showing full image, artist info, and voting.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArtworkDetailScreen(
    artworkId: String,
    onBack: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val artwork = uiState.featuredArtworks.find { it.id == artworkId }
    var hasVoted by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { /* share */ }) {
                        Icon(Icons.Filled.Share, contentDescription = "Share")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = DeepSepia)
            }
        } else if (artwork != null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .background(MaterialTheme.colorScheme.background),
            ) {
                // Artwork image
                AsyncImage(
                    model = artwork.imageUrl,
                    contentDescription = artwork.title,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                )

                Column(modifier = Modifier.padding(20.dp)) {
                    // Title and artist
                    Text(
                        text = artwork.title,
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "by ${artwork.displayName}",
                        style = MaterialTheme.typography.bodyLarge,
                        color = DeepSepia,
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Campaign info
                    if (!artwork.campaignTitle.isNullOrEmpty()) {
                        Surface(
                            shape = MaterialTheme.shapes.medium,
                            color = DeepSepia.copy(alpha = 0.08f),
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Campaign",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = DeepSepia,
                                )
                                Text(
                                    text = artwork.campaignTitle,
                                    style = MaterialTheme.typography.titleSmall,
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Description
                    Text(
                        text = "About This Work",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "This artwork was created as part of the Tonghua Public Welfare program, " +
                                "connecting children's creativity with sustainable fashion. Each piece tells " +
                                "a unique story and contributes to charitable education programs.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SlateGray,
                        lineHeight = MaterialTheme.typography.bodyMedium.lineHeight,
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Vote section
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(
                                text = "${artwork.voteCount + if (hasVoted) 1 else 0} votes",
                                style = MaterialTheme.typography.headlineSmall,
                                color = DeepSepia,
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Support this artwork by voting",
                                style = MaterialTheme.typography.bodySmall,
                                color = SlateGray,
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = {
                                    if (!hasVoted) {
                                        hasVoted = true
                                        viewModel.voteArtwork(artworkId)
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                colors = if (hasVoted) {
                                    ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                                } else {
                                    ButtonDefaults.buttonColors(containerColor = DeepSepia)
                                },
                                shape = MaterialTheme.shapes.medium,
                            ) {
                                Icon(
                                    imageVector = if (hasVoted) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp),
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (hasVoted) "Voted" else "Vote for This Artwork",
                                    color = PaperWhite,
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Metadata
                    Text(
                        text = "Details",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    MetadataRow("Status", artwork.status.replace("_", " ").uppercase())
                    MetadataRow("Votes", "${artwork.voteCount}")
                    if (!artwork.campaignTitle.isNullOrEmpty()) {
                        MetadataRow("Campaign", artwork.campaignTitle)
                    }

                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        } else {
            // Artwork not found
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "Artwork not found",
                    style = MaterialTheme.typography.bodyLarge,
                    color = SlateGray,
                )
            }
        }
    }
}

@Composable
private fun MetadataRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = SlateGray,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
    Divider(color = EditorialDivider.copy(alpha = 0.3f))
}
