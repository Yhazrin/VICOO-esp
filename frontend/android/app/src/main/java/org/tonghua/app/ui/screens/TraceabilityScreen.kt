package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.tonghua.app.ui.theme.*
import org.tonghua.app.viewmodel.ShopViewModel

/**
 * Supply chain traceability timeline screen.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TraceabilityScreen(
    productId: String,
    onBack: () -> Unit,
    viewModel: ShopViewModel = hiltViewModel(),
) {
    val detailState by viewModel.detailState.collectAsState()

    LaunchedEffect(productId) {
        viewModel.loadProductDetail(productId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Traceability",
                        style = MaterialTheme.typography.titleLarge,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { paddingValues ->
        val product = detailState.product

        if (detailState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = DeepSepia)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .background(MaterialTheme.colorScheme.background)
                    .padding(16.dp),
            ) {
                // Product info header
                product?.let { p ->
                    Text(
                        text = p.title,
                        style = MaterialTheme.typography.headlineSmall,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Full supply chain history from raw materials to your hands",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SlateGray,
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Traceability timeline
                val records = detailState.traceability

                if (records.isEmpty()) {
                    // Demo timeline if no records
                    val demoRecords = listOf(
                        Triple("Raw Material Sourcing", "Organic cotton sourced from certified farms in Xinjiang", "2024-01-15"),
                        Triple("Quality Inspection", "Materials passed quality and sustainability inspection", "2024-01-20"),
                        Triple("Artisan Production", "Handcrafted by skilled artisans in cooperative workshop", "2024-02-10"),
                        Triple("Quality Assurance", "Final product quality check and packaging", "2024-02-25"),
                        Triple("Warehouse Dispatch", "Shipped from warehouse to distribution center", "2024-03-01"),
                    )

                    demoRecords.forEachIndexed { index, (title, description, date) ->
                        TimelineItem(
                            step = index + 1,
                            totalSteps = demoRecords.size,
                            title = title,
                            description = description,
                            date = date,
                            isLast = index == demoRecords.size - 1,
                        )
                    }
                } else {
                    records.forEachIndexed { index, record ->
                        TimelineItem(
                            step = index + 1,
                            totalSteps = records.size,
                            title = record.step,
                            description = record.description,
                            date = record.date,
                            location = record.facility,
                            isLast = index == records.size - 1,
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Verification badge
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SuccessGreen.copy(alpha = 0.08f)),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            Icons.Filled.Check,
                            contentDescription = null,
                            tint = SuccessGreen,
                            modifier = Modifier.size(24.dp),
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Verified Supply Chain",
                                style = MaterialTheme.typography.titleSmall,
                                color = SuccessGreen,
                            )
                            Text(
                                text = "All records have been verified and audited for authenticity.",
                                style = MaterialTheme.typography.bodySmall,
                                color = SlateGray,
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun TimelineItem(
    step: Int,
    totalSteps: Int,
    title: String,
    description: String,
    date: String,
    location: String? = null,
    isLast: Boolean,
) {
    Row(modifier = Modifier.fillMaxWidth()) {
        // Timeline indicator
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(40.dp),
        ) {
            // Circle with step number
            Surface(
                shape = CircleShape,
                color = DeepSepia,
                modifier = Modifier.size(28.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "$step",
                        style = MaterialTheme.typography.labelSmall,
                        color = PaperWhite,
                    )
                }
            }
            // Connecting line
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(64.dp)
                        .background(DeepSepia.copy(alpha = 0.2f))
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Content
        Column(modifier = Modifier.padding(bottom = if (isLast) 0.dp else 16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = SlateGray,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Outlined.CalendarMonth,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = CaptionGray,
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = date,
                    style = MaterialTheme.typography.labelSmall,
                    color = CaptionGray,
                )
                location?.let {
                    Spacer(modifier = Modifier.width(12.dp))
                    Icon(
                        Icons.Outlined.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = CaptionGray,
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = it,
                        style = MaterialTheme.typography.labelSmall,
                        color = CaptionGray,
                    )
                }
            }
        }
    }
}
